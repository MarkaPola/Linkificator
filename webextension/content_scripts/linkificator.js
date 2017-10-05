
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Linkification core - Linkificator's module
 * author: MarkaPola */


"use strict";

// extend RegExp to handle meta-character escaping
RegExp.escape = function(string) {
    return string.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1');
};

// state parsing management
function State (document) {
	const statusLabel = 'data-linkificator-status';

	var body = document.body;

	return {
        isValid: function (action) {
	        if (action === 'parse' && body.hasAttribute(statusLabel) && body.getAttribute(statusLabel) != 'configured') {
		        // parsing is already in process or done
		        return false;
            }
	        if (action === 're-parse' && (!body.hasAttribute(statusLabel) || (body.getAttribute(statusLabel) != "complete" && body.getAttribute(statusLabel) !== 'configured'))) {
		        // parsing is not yet started or is in process
		        return false;
	        }
            
	        if (action === 'undo' && !body.hasAttribute(statusLabel)) {
		        // parsing is not yet started
		        return false;
	        }

            return true;
        },
        
        process: function () {
            body.setAttribute(statusLabel, 'in-process');
        }, 
		inProcess: function () {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) === 'in-process';
		},

		configured: function () {
			body.setAttribute(statusLabel, 'configured');
		},
		isConfigured: function () {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) === 'configured';
		},
        
		complete: function () {
			body.setAttribute(statusLabel, 'complete');
		},
		isComplete:  function() {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) === 'complete';
		},

        undo: function () {
			body.setAttribute(statusLabel, 'in-undo');
        },
        
		reset: function () {
			if (body.hasAttribute(statusLabel)) {
				body.removeAttribute(statusLabel);
			}
		}
	};
}

function isValidDocument (properties) {
    let contentType = properties.document.contentType;
	return contentType.startsWith('text/html') || contentType.startsWith('text/plain')
		|| contentType.startsWith('application/xhtml');
}

// Handle dynamic document changes using MutationObserver interface
var documentObserver = (function () {
    let config = {childList: true, subtree: true};
    let observing = false;
    let interval = {active: true, value: 2000};
    let delay = 300;
    let date = Date.now();
    
    let observer = new MutationObserver ((function (mutations) {
        observing = false;
        observer.disconnect();
        // empties record queue
        observer.takeRecords();
        
        let delta = Date.now() - date;
        date = Date.now();

        setTimeout(function() {
            port.postMessage ({id: 'document-changed'});
        }, (!interval.active || delta > interval.value) ? 0 : interval.value-delta);
    }).bind(this));

    return {
        observe: function (properties) {
            observing = true;

            if (properties !== undefined) {
                interval = properties.interval;
                delay = properties.delay;
            }
            
            // wait a little before starting to observe to ensure all changes are done...
            setTimeout(function() {
                observer.observe(window.document, config);
            }, delay);
        },
        disconnect: function () {
            if (observing) {
                observing = false;
                observer.disconnect();
            }
        }
    };
})();

function Parser (properties) {

    function buildPattern (data) {
        var result = "";
        
        for (let index = 0; index < data.length; ++index) {
            if (result.length) {
                result += "|";
            }
            result += data[index].pattern;
        }
        
        return result;
    }
    
    function buildMatcher (data) {
        var result = [];
        
        for (let index = 0; index < data.length; ++index) {
            result.push ({regex: new RegExp("^"+data[index].pattern+"$","i"), term: data[index].term});
        }
        
        return result;
    }
    
    var protocol_matcher = buildMatcher (properties.predefinedRules.protocols);
    var subdomain_matcher = buildMatcher (properties.predefinedRules.subdomains);

    function getTerm (items, data) {
        for (let index = 0; index < items.length; ++index) {
            if (items[index].regex.test(data)) {
                return items[index].term;
            }
        }

        return data;
    }
    function getProtocol (data) {
        return getTerm (protocol_matcher, data);
    }
    function getDomainProtocol (data) {
        return getTerm (subdomain_matcher, data);
    }
    
    // Helper Functions to manage various patterns used to match the different URL formats

    // Count all captures of a regular expression. Assume the regex is syntactically valid.
    function captureCount (regex) {
        let count = 0;
        let inSet = false;

        for (let index = 0; index < regex.length; ++index) {
            if (regex.charAt(index) === '\\') {
                ++index;
                continue;
            }
            if (regex.charAt(index) === '[') {
                inSet = true;
                continue;
            }
            if (regex.charAt(index) === ']') {
                inSet = false;
                continue;
            }
            if (regex.charAt(index) === '(' && !inSet) {
                if (regex.indexOf("?", index) != index+1)
                    count += 1;
            }
        }

        return count;
    }

    // Base class to manage pattern matching a family of URLs (like e-mail or http)
    function PatternRule (text) {
        if (text === undefined) return;

        this._regex = text;
        this._captures = captureCount(text);
        this._index = 0;
    }
    PatternRule.prototype = {
        set start (value) {
            this._index = value;
        },
        get count () {
            return this._captures;
        },
        get pattern () {
            return this._regex;
        },
        set pattern (text) {
            this._regex = text;
            this._captures = captureCount(text);
        },

        test: function (regex) {
            return false;
        },
        getURL: function (regex) {
            return null;
        }
    };

    // to handle all pattern matching rules
    function Pattern (prefix) {
        var count = captureCount(prefix);
        var index = count+2;
        var pattern = prefix + "(";
        var subpatterns = [];

        var first = true;

        var URLregex;

        return {
            push: function (subpattern) {
                subpattern.start = index;
                index += subpattern.count;
                if (first) {
                    first = false;
                } else {
                    pattern += "|";
                }
                pattern += subpattern.pattern;
                subpatterns.push(subpattern);
            },

            compile: function () {
                pattern += ")";
                URLregex = new RegExp(pattern, 'i');
            },

            match: function (text) {
                let index = 0;
                let data = text;
                let valid = false;
                let result = null;

                while (!valid) {
                    if (!(result = URLregex.exec(data))) {
                        break;
                    }

                    for (let i = 0; i < subpatterns.length; ++i) {
                        if ((valid = subpatterns[i].test(result))) {
                            break;
                        }
                    }
                    if (!valid) {
                        index += result.index+result[0].length;
                        data = data.substr (result.index+result[0].length);
                    }
                }
                
                if (result) {
                    return {
                        get regex () { return result; },
                        get text () { return result[count+1]; },
                        get index () {
                            let total = index + result.index;
                            for (let i = 1; i <= count; ++i) {
                                total += result[i].length;
                            }
                            return total;
                        },
                        get length () { return result[count+1].length; },
                        get url () {
                            for (let i = 0; i < subpatterns.length; ++i) {
                                let data = subpatterns[i].getURL(result);
                                if (data) return data;
                            }
                            // in normal condition, not reached
                            return "";
                        }
                    };
                } else {
                    return null;
                }
            }
        };
    }

    // regexps are based on various RFC, mainly 1738, 822, 1036 and 2732
    const IPv4 = "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    const IPv6 = "(?:\\[(?:(?:(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){6}:[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){5}:(?:[0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){4}:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){3}:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){2}:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){6}(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:(?:[0-9a-f]{1,4}:){0,5}:(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:::(?:[0-9a-f]{1,4}:){0,5}(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:[0-9a-f]{1,4}::(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})|(?:::(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){1,7}:))\\])";
    const IP = "(?:" + IPv4 + "|" + IPv6 + ")";

    const protocol = "(" + buildPattern(properties.predefinedRules.protocols) + ")";

    const authentication = "(?:[\\w%$#&_\\-]+(?::[^@:/\\s]+)?@)";
    const full_authentication = "(?:[\\w%$#&_\\-]+:[^@:/\\s]+@)";

    const start_uri_delimiter = "\\s.。,‚，、;；:：!！?？=＝\\-－—*＊#＃&＆()（）〔〕[\\]［］【】{}｛｝'＇`‛‵\"＂‟„〟<>＜＞‹›《》「」｢｣『』﹂﹁﹄﹃«»“”〝〞‘’";
    const end_uri_delimiter = "\\s.。,‚，、;；:：!！？＝\\-－—＊＃＆()（）〔〕[\\]［］【】{}｛｝'＇`‛‵\"＂‟„〟<>＜＞‹›《》「」｢｣『』﹂﹁﹄﹃«»“”〝〞‘’";

    const start_path_delimiter = "/\\?#";
    
    const domain_class = "@?#\\s()<>[\\]{}/.:";
    const domain_element = "(?:[^-"+domain_class+"](?:[^"+domain_class+"]{1,}[^-\\\\"+domain_class+"]|[^-\\\\"+domain_class+"])?)";

    const tld = "(?:\\.(?:" + properties.domains.join('|') + ")(?=(?:$|[" + start_path_delimiter + end_uri_delimiter + "])))";
            
    const mail_domain = properties.predefinedRules.support.email.useTLD ? "(?:" + domain_element + "(?:\\." + domain_element + ")*" + tld +")"
                                                                        : "(?:" + domain_element + "(?:\\." + domain_element + ")*)";
        
    const domain = properties.predefinedRules.support.standard.useTLD ? "(?:" + domain_element + "(?:\\." + domain_element + ")*" + tld +")"
                                                                      : "(?:" + domain_element + "(?:\\." + domain_element + ")*)";
    const full_domain = properties.predefinedRules.support.standard.useTLD ? domain
                                                                           : "(?:" + domain_element + "(?:\\." + domain_element + ")+)";

    const subdomain = "(?:(" + buildPattern(properties.predefinedRules.subdomains) + ")\\.)";
    const port = "(?::[\\d]{1,5})?";

    const IP_host = IP + port;
    const domain_host = domain + port;
    const full_domain_host = full_domain + port;

    const subpath = "(?:(?:(?:[^\\s()<>]+|\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\))+(?:\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\)|[^" + end_uri_delimiter + "]))|[^" + end_uri_delimiter + "])";
    
    // define sub-classes from PatternRule for the various URI formats
    ///// e-mail without protocol specification
    function MailRule () {
        PatternRule.call(this, "((?:[\\w\\-_.!#$%&'*+/=?^`{|}~]+@)" + "(?:" + mail_domain + "|" + IP + "))");
    }
    MailRule.prototype = new PatternRule;
    MailRule.prototype.test = function(regex) {
        return properties.predefinedRules.support.email.active && regex[this._index] !== undefined;
    };
    MailRule.prototype.getURL = function(regex) {
        if (regex[this._index])
            return "mailto:" + regex[this._index];
        else
            return null; 
    };
    ///// full e-mail, including protocol specification
    function FullMailRule () {
        MailRule.call(this);
        // update pattern
        this.pattern = "(?:mailto:" + this.pattern + ")";
    }
    FullMailRule.prototype = new MailRule;

    ///// news protocol. authority is optional
    function NewsRule () {
        PatternRule.call(this, "(news:(?:(?://" + authentication + "?(?:" + domain_host + "|" + IP_host + "))|(?:" + domain_element + "(?:\\." + domain_element + ")*))" + "(?:[" + start_path_delimiter + "]" + subpath + ")?)");
    }
    NewsRule.prototype = new PatternRule;
    NewsRule.prototype.test = function(regex) {
        return properties.predefinedRules.support.standard.active && regex[this._index] !== undefined;
    };
    NewsRule.prototype.getURL = function(regex) {
        if (regex[this._index])
            return regex[this._index];
        else
            return null; 
    };
    
    ///// Full protocol (including protocol specification except e-mail one)
    function FullProtocolRule () {
        PatternRule.call(this, "(" + protocol + authentication + "?(?:" + domain_host + "|" + IP_host + ")" + "(?:[" + start_path_delimiter + "]" + subpath + ")?)");
    }
    FullProtocolRule.prototype = new PatternRule;
    FullProtocolRule.prototype.test = function(regex) {
        return properties.predefinedRules.support.standard.active && regex[this._index] !== undefined;
    };
    FullProtocolRule.prototype.getURL = function(regex) {
        if (regex[this._index]) {
            let protocol_index = this._index+1;
            // url includes the protocol
            return regex[this._index].replace(regex[protocol_index], getProtocol(regex[protocol_index]));
        } else {
            return null;
        }
    };
    ///// url including authentication but without protocol
    function AuthenticatedDomainRule () {
        if (properties.predefinedRules.support.standard.useSubdomains) {
            PatternRule.call(this, "(" + full_authentication + "(?:" + subdomain + domain_host + "|" + domain_host + "|" + IP_host + ")" + "(?:[" + start_path_delimiter + "]" + subpath + ")?)");
        } else {
            PatternRule.call(this, "(" + full_authentication + "(?:" + domain_host + "|" + IP_host + ")" + "(?:[" + start_path_delimiter + "]" + subpath + ")?)");
        }
    }
    AuthenticatedDomainRule.prototype = new PatternRule;
    AuthenticatedDomainRule.prototype.test = function(regex) {
        return properties.predefinedRules.support.standard.active && regex[this._index] !== undefined;
    };
    AuthenticatedDomainRule.prototype.getURL = function(regex) {
        if (regex[this._index]) {
            if (properties.predefinedRules.support.standard.useSubdomains) {
                let subdomain_index = this._index+1;
                if (regex[subdomain_index]) {
                    // protocol less url with known subdomain
                    // Deduce protocol from the subdomain
                    return getDomainProtocol(regex[subdomain_index]) + regex[this._index];
                } else {
                    // protocol less url, assume http
                    return "http://" + regex[this._index];
                }
            } else {
                // protocol less url, assume http
                return "http://" + regex[this._index];
            }
        } else {
            return null;
        }
    };
    ///// protocol-less url with optional authentication
    function DomainRule () {
        AuthenticatedDomainRule.call(this);
        if (properties.predefinedRules.support.standard.useSubdomains) {
            if (properties.predefinedRules.support.standard.linkifyAuthority) {
                this.pattern = "((?:" + authentication + "?(?:(?:" + subdomain + domain_host + "(?:[" + start_path_delimiter + "]" + subpath + ")?)|(?:(?:" + full_domain_host + "|" + IP_host + ")[" + start_path_delimiter + "]" + subpath + "?)))|(?:" + full_domain_host + "(?:[" + start_path_delimiter + "]" + subpath + ")?))";
            } else {
                this.pattern = "(" + authentication + "?(?:(?:" + subdomain + domain_host + "(?:[" + start_path_delimiter + "]" + subpath + ")?)|(?:(?:" + full_domain_host + "|" + IP_host + ")[" + start_path_delimiter + "]" + subpath + "?)))";
            }
        } else {
            if (properties.predefinedRules.support.standard.linkifyAuthority) {
                this.pattern = "((?:" + authentication + "?(?:(?:" + full_domain_host + "|" + IP_host + ")[" + start_path_delimiter + "]" + subpath + "?))|(?:" + full_domain_host + "(?:[" + start_path_delimiter + "]" + subpath + ")?))";
            } else {
                this.pattern = "(" + authentication + "?(?:(?:" + full_domain_host + "|" + IP_host + ")[" + start_path_delimiter + "]" + subpath + "?))";
            }
        }
    }
    DomainRule.prototype = new AuthenticatedDomainRule;
    
    ///// Custom rules handling
    function CustomRule (rule) {
        this._rule = rule;
        this._pattern = new RegExp(rule.pattern, 'i');

        PatternRule.call(this, "("+rule.pattern+")");
    }
    CustomRule.prototype = new PatternRule;
    CustomRule.prototype.test = function(regex) {
        return regex[this._index] !== undefined;
    };
    CustomRule.prototype.getURL = function(regex) {
        if (regex[this._index]) {
            return regex[this._index].replace(this._pattern, this._rule.url);
        } else {
            return null;
        }
    };
    
    function buildCustomRules (pattern, rules) {
        for (let index = 0; index < rules.length; ++index) {
            let rule = rules[index];

            if (!rule.active) continue;
            
            pattern.push(new CustomRule(rule));
        }
    }

    // remove tag <pre> from excludedElements for plain text document
    if (properties.document.contentType.startsWith('text/plain')) {
        let index = properties.predefinedRules.excludedElements.indexOf('pre');
        if (index != -1)
            properties.predefinedRules.excludedElements.splice(index, 1);
    }
    
    var pattern = Pattern ("(^|[" + start_uri_delimiter + "]+)");
    if (properties.customRules.support.before)
        buildCustomRules(pattern, properties.customRules.rules.beforeList);
    pattern.push(new FullMailRule);
    pattern.push(new NewsRule);
    pattern.push(new FullProtocolRule);
    pattern.push(new AuthenticatedDomainRule);
    pattern.push(new DomainRule);
    pattern.push(new MailRule);
    if (properties.customRules.support.after)
        buildCustomRules(pattern, properties.customRules.rules.afterList);
    pattern.compile();

    var requiredChars = properties.requiredCharacters;
    
    var query =  "//text()[ancestor::*[local-name()='body'] and not(ancestor::*[local-name()='" + properties.predefinedRules.excludedElements.join("'] or ancestor::*[local-name()='")
        + "']) and not(ancestor::*[@style[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'display:none')]]) and (";
    if (properties.predefinedRules.support.standard.useSubdomains) {
        for (let index = 0; index < properties.predefinedRules.subdomains.length; ++index) {
            let sub_domain = properties.predefinedRules.subdomains[index].filter;
            query += "contains(translate(., '" + sub_domain.toUpperCase() + "', '" + sub_domain.toLowerCase() + "'), '" + sub_domain.toLowerCase() + "') or ";
        }
    }
    if (properties.predefinedRules.support.email.useTLD
        || properties.predefinedRules.support.standard.useTLD) {
        requiredChars.indexOf('.') === -1 && requiredChars.push('.');
    }
    query += "contains(., '" + requiredChars.join("') or contains(., '") + "'))]";
    
    var query2 =  "(//*[local-name()='" + properties.extraFeatures.inlineElements.join("' or local-name()='") + "'])[ancestor::*[local-name()='body'] and not(..[local-name()='" + properties.extraFeatures.inlineElements.join("'] or ..[local-name()='") + "']) and not(ancestor::*[local-name()='" + properties.predefinedRules.excludedElements.join("'] or ancestor::*[local-name()='")
        + "']) and not(ancestor::*[@style[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'display:none')]])]/..";

    return {
        get requiredCharacters () {
            var result = [];
            requiredChars.forEach(function (value,index) {
                result[index] = RegExp.escape(value);
            });
            return result;
        },
        
        textNodes: function (document) {
            return document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        },

        splittedTextNodes: function (document) {
            return document.evaluate(query2, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        },

        match: function (text) {
            return pattern.match(text);
        }
    };
}

function Linkify (document, statistics, properties, style, completed) {
    if (document) {
        let ref = this;
        ref.statistics = statistics;
        ref.count = 0;
        ref.document = document;
        ref.style = style;

        return {
            execute: function () {
                // return false until text node is fully linkified
                return ref.linkify.call (ref, function(iterations){return iterations == properties.processing.iterations;});
            },
            
            finish: function () {
                ref.linkify.call (ref, function(iterations){return false;});
            },
            
            complete: function (thread) {
                ref.statistics.store(ref.count);

                port.postMessage({id: 'statistics', statistics: ref.statistics.get()});

                if (completed)
                    completed();

                threads.detach(thread);
            },
            
            abort: function () {
                // nothing to do
            }
        };
    }
}
Linkify.prototype = {
    newAnchor: function (url) {
        let anchor = this.document.createElement('a');
        anchor.setAttribute('title', 'Linkificator: ' + url);
        anchor.setAttribute('href', url);
        anchor.setAttribute('class', 'linkificator-ext');
        if (this.style.length != 0) {
            anchor.setAttribute('style', this.style);
        }

        return anchor;
    }
};

// To linkify text nodes.
function LinkifyNode (node, statistics, properties, parser, style, completed) {
    function TextNode (node, requiredChars) {
        if (node) {
            this._node = node;
            this._items = [];

            // split text to speed-up URI pattern matching
            let regex = new RegExp("[^\\s'\"<>«»“”‘’]+", "g");
            let text = node.nodeValue;
            let result;
            
            while ((result = regex.exec (text)) !== null) {
                if ((properties.extraFeatures.maxDataSize == 0 || result[0].length <= properties.extraFeatures.maxDataSize) && result[0].search(requiredChars) != -1) {
                    this._items.push({offset: result.index, text: result[0]});
                }
            }
        }
    }
    TextNode.prototype = {
        get node () {
            return this._node;
        },
        get length () {
            return this._items.length;
        },
        text: function (index) {
            if (index === undefined) {
                return this._node.nodeValue;
            } else {
                return this._items[index].text;
            }
        },
        offset: function (index,  pos) {
            return this._items[index].offset + pos;
        }
    };
    
    if (node) {
        if (!node.parentNode) {
            // for unknown reason (for now !), some text nodes does not have a parent.
            // these nodes cannot be handled and are ignored.
            this.node = null;
        } else {
            this.parser = parser;

            this.textNode = new TextNode(node, new RegExp(parser.requiredCharacters.join("|"),"i"));

            this.offset = 0;
            this.node = node;
            this.parent = node.parentNode;
            this.index = 0;
        }
        
        return Linkify.call(this, node.ownerDocument, statistics, properties, style, completed);
    }
}
LinkifyNode.prototype = new Linkify;
LinkifyNode.prototype.linkify = function (isOver) {
    if (!this.node)
        return true;
    
    var iterations = 0;

    for (; !isOver(iterations) && this.index < this.textNode.length; ++iterations, ++this.index) {
        let text = this.textNode.text(this.index);
        let start = 0;
        let match = null;
        
        while ((match = this.parser.match(text.substring(start)))) {
            let pos = start + match.index;
            start =  pos + match.length;
            let url = match.url;
            
            this.count++;
            let sibling = this.node.nextSibling;
                    
            this.parent.removeChild(this.node);
            this.parent.insertBefore(this.document.createTextNode(this.node.nodeValue.substring(0, this.textNode.offset(this.index,pos)-this.offset)), sibling);
            
            let anchor = this.newAnchor(match.url);
            anchor.appendChild(this.document.createTextNode(match.text));
            this.parent.insertBefore(anchor, sibling);

            this.parent.insertBefore(this.document.createTextNode(this.node.nodeValue.substring(this.textNode.offset(this.index,start)-this.offset)), sibling);
                    
            // update for future treatments
            this.offset = this.textNode.offset(this.index,start);
            this.node = anchor.nextSibling;
        }
    }

    return this.index === this.textNode.length;
};

// To linkify URLs splitted on multiple text nodes
function LinkifySplittedText (node, statistics, properties, parser, style, completed) {
    // parse current node to list "root" nodes of splitted urls
    function TextNode () {
        this._text = "";
        this._items = [];
        this._nodes = [];
    }
    TextNode.prototype = {
        get length () {
            return this._items.length;
        },
        text: function (index) {
            if (index === undefined) {
                return this._text;
            } else {
                return this._items[index].text;
            }
        },
        add: function (node) {
            this._nodes.push({index: this._text.length, node: node});
            this._text += node.nodeValue;
        },
        reset: function () {
            this._text = "";
            this._nodes = [];
        },
        finalize: function (requiredChars) {
            // split potential huge string in a list of smaller ones
            // to speed-up URI pattern matching
            let regex = new RegExp("[^\\s'\"<>«»“”‘’]+", "g");
            let result;
            while ((result = regex.exec (this._text)) !== null) {
                if ((properties.extraFeatures.maxDataSize == 0 || result[0].length <= properties.extraFeatures.maxDataSize) && result[0].search(requiredChars) != -1) {
                    this._items.push({offset: result.index, text: result[0]});
                }
            }
        },
        offset: function (index,  pos) {
            return this._items[index].offset + pos;
        }, 
        match: function (index, start, end) {
            start += this._items[index].offset;
            end += this._items[index].offset;
            
            return this._nodes.filter(
                function (element, index, array) {
                    if (element.node === null)
                        return false;
                    
                    let max = element.index + element.node.nodeValue.length - 1;
                    return (start >= element.index && start <= max)
                        || (end >= element.index && end <= max)
                        || (start < element.index && end > max);
                });
        }
    };
    
    if (node) {
        this.parser = parser;

        this.textNodes = (function parse (node) {
            const inline = new RegExp("^("+properties.extraFeatures.inlineElements.join("|")+")$","i");
            const requiredChars = new RegExp(parser.requiredCharacters.join("|"),"i");

            var nodes = new Array;          
            var textNode = new TextNode;
            var inlineFound = false;

            function walk (node) {
                var list = node.childNodes;

                for (let index = 0; index < list.length; ++index) {
                    let child = list.item(index);
                    if (child.nodeType == 3) {// Text node
                        textNode.add(child);
                    } else if (child.nodeName.search(inline) != -1) {
                        inlineFound = true;
                        walk(child);
                    } else {
                        if (inlineFound && textNode.text().search(requiredChars) != -1) {
                            textNode.finalize(requiredChars);
                            nodes.push(textNode);
                            textNode = new TextNode;
                        } else {
                            textNode.reset();
                        }
                        inlineFound = false;
                    }
                }
            }
            walk(node);
            // full contents of node is a textNode
            if (inlineFound && textNode.text().search(requiredChars) != -1) {
                textNode.finalize(requiredChars);
                nodes.push(textNode);
            }

            return nodes;
        })(node);
        this.index = 0;
        
        return Linkify.call(this, node.ownerDocument, statistics, properties, style, completed);
    }
}
LinkifySplittedText.prototype = new Linkify;
LinkifySplittedText.prototype.linkify = function (isOver) {
    var iterations = 0;

    for (; !isOver(iterations) && this.index < this.textNodes.length; ++iterations, ++this.index) {
        let textNode = this.textNodes[this.index];
        
        for (let i = 0; i < textNode.length; ++i) {
            let text = textNode.text(i);
            let start = 0;
            let match = null;
            
            while ((match = this.parser.match(text.substring(start)))) {
                let pos = start + match.index;
                start =  pos + match.length;
                let url = match.url;
                
                // retrieve list of nodes impacted by url
                let list = textNode.match(i, pos, pos+match.length-1);

                this.count++;
                
                if (list.length < 2) {
                    // not splitted url
                    let element = list[0];
                    let node = element.node;
                    let parent = node.parentNode;
                    let sibling = node.nextSibling;
                    
                    parent.removeChild(node);
                    parent.insertBefore(this.document.createTextNode(node.nodeValue.substring(0, textNode.offset(i,pos)-element.index)), sibling);
                    
                    let anchor = this.newAnchor(match.url);
                    anchor.appendChild(this.document.createTextNode(match.text));
                    parent.insertBefore(anchor, sibling);

                    parent.insertBefore(this.document.createTextNode(node.nodeValue.substring(textNode.offset(i,start)-element.index)), sibling);
                    
                    // update descriptor for future treatments
                    if (anchor.nextSibling.nodeType == 3) {
                        // this is a text node
                        element.index = textNode.offset(i,start);
                        element.node = anchor.nextSibling;
                    } else {
                        // text of last node of range is exhausted
                        element.node = null;
                    }
                } else {
                    // create range matching URL and attach it to the anchor
                    let range = document.createRange();
                    let element = list[0];
                    range.setStart(element.node, textNode.offset(i,pos)-element.index);
                    element = list[list.length-1];
                    range.setEnd(element.node, textNode.offset(i,start)-element.index);

                    let anchor = this.newAnchor(url);
                    anchor.appendChild(range.extractContents());
                    range.insertNode(anchor);

                    range.detach();
                    
                    // update descriptor for future treatments
                    if (anchor.nextSibling.nodeType == 3) {
                        // this is a text node
                        element.index = textNode.offset(i,start);
                        element.node = anchor.nextSibling;
                    } else {
                        // text of last node of range is exhausted
                        element.node = null;
                    }
                    // erase all previous nodes of the list
                    for (let li = list.length-2; li >= 0; li--) {
                        list[li].node = null;
                    }
                }
            }
        }
    }

    return this.index === this.textNodes.length;
};


function configure () {
    var document = window.document;

    var state = State(document);

    if (!state.isValid('parse')) {
        return;
    }

    var statistics = Statistics(document, 'parse');

    state.configured();
    port.postMessage({id: 'configured'});
}

function execute (action, properties) {
    var document = window.document;

    var state = State(document);
    if (!state.isValid(action)) {
        return;
    }
    state.process();
	
    var statistics = Statistics(document, action);

    var style = (function (style) {
        let format = "";

        if (style.text.override) {
            format = "color:" + style.text.color;
        }
        if (style.background.override) {
            format += (format.length != 0) ? "; " : "";
            format += "background-color:" + style.background.color;
        }

        return format;
    })(properties.style);

    var parser = Parser(properties);

    function parseNodes () {
        function parseDocument (getNodes, linkify) {
            function* Snapshot (elements) {
                let size = elements.snapshotLength;
                
                for (let index = 0; index < size; ++index) {
                    yield elements.snapshotItem(index);
                }
            }
            let snapshot = Snapshot(getNodes(document));
            let count = 0;

            function nextNode () {
                count += 1;
                if (count > properties.processing.iterations) {
                    count = 1;
                    setTimeout(function(){parseNode();}, properties.processing.interval);
                } else {
                    parseNode();
                }
            }
            function parseNode () {
                let item = snapshot.next();
                if (!item.done) {
                    let thread = Thread(new linkify(item.value, statistics, properties, parser, style, nextNode),
                                        properties.processing.interval);
                    threads.push(thread);
                    thread.start();
                }
            }

            nextNode();
        }
        
        statistics.store(0);

        if (properties.extraFeatures.support.inlineElements) {
            // start parsing by splitted text nodes
            parseDocument(parser.splittedTextNodes, LinkifySplittedText);
        }
        parseDocument(parser.textNodes, LinkifyNode);
        
        state.complete();
        port.postMessage({id: 'completed'});
    }
    
    parseNodes();
}

function parse (properties) {
    if (!isValidDocument(properties)) {
        return;
    }
    
    documentObserver.disconnect();

    if (properties.manual)
        configure ();
    else
    {
        execute('parse', properties);
    
        if (properties.extraFeatures.support.autoLinkification) {
            documentObserver.observe(properties.extraFeatures.autoLinkification);
        }
    }
}

function undo () {
    var document = window.document;

    var state = State(document);
    if (!state.isValid('undo')) {
        return;
    }
    state.undo();
    
    // abort any running linkifications...
    threads.apply(function (thread) {
        thread.kill();
    });
    threads.splice();
    
    // get list of anchors with class 'linkificator-ext'
    var query = "//a[@class='linkificator-ext']";
    var anchors = document.evaluate(query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var size = anchors.snapshotLength;
    // remove anchor: attach anchor's childs to the parent
    for (let index = 0; index < size; ++index) {
        let anchor = anchors.snapshotItem(index);
        let parent = anchor.parentNode;
        while (anchor.firstChild) {
            parent.insertBefore(anchor.removeChild(anchor.firstChild), anchor);
        }
        parent.removeChild(anchor);
    }

    state.reset();

    Statistics(document, 'undo');

    port.postMessage({id: 'statistics', statistics: Statistics(document, 'undo').get()});
}

var threads = [];
threads.apply = function (action) {
    this.forEach (function (thread, index, array) {
        action (thread, index, array);
    });
};
threads.detach = function (thread) {
    var index = this.indexOf(thread);
    if(index != -1) {
        this.splice(index, 1);
    }
};


// manage communication with background script
var port;
function connect () {
    port = browser.runtime.connect({name: 'linkificator'});
    
    port.onMessage.addListener(message => {
        switch (message.id) {
        case 'parse':
            parse (properties);
            break;

        case 're-parse':
            documentObserver.disconnect();

            let date = Date.now();
            execute('re-parse', properties);
            
            if (!properties.manual && properties.extraFeatures.support.autoLinkification) {
                if (properties.extraFeatures.autoLinkification.threshold.active
                    && (Date.now()-date > properties.extraFeatures.autoLinkification.threshold.value))
                    // processing time is too costly, deactivate auto linkification
                    return;
                
                documentObserver.observe(properties.extraFeatures.autoLinkification);
            }
            break;

        case 'undo':
            documentObserver.disconnect();
            undo();
            break;
        }
    });

    // send back to background script type of document to intiate dialog
    port.postMessage({id: 'content-type', contentType: properties.document.contentType});
}


// properties management
const topLevelDomains = ['tldGenerics', 'tldCountryCodes', 'tldGeographics',
                         'tldCommunities', 'tldBrands'];

var area = 'local';
var properties = {};

function getActiveDomains (properties) {
    let domains = [];
    
    for (let tld of topLevelDomains) {
        if (properties[tld].active) {
            domains = domains.concat(properties[tld].domains);
        }
    }

    return domains.sort().filter((value, index, self) => self.indexOf(value) === index);
}


browser.storage.local.get('sync').then(result => {
    area = result.sync ? 'sync' : 'local';
    
    browser.storage[area].get().then(results => {
        properties = results;
        properties.document = {contentType: Document(window.document).contentType};

        // join all active domains
        properties.domains = getActiveDomains (properties);

        // properties are now available, let start processing
        connect();
    }, reason => console.error(reason));
});


browser.storage.onChanged.addListener((changes,  areaName) => {
    if (areaName === area) {
        for (let key in changes) {
            properties[key] =  changes[key].newValue;

            if (topLevelDomains.includes(key)) {
                properties.domains = getActiveDomains (properties);
            }
        }
    }
});
