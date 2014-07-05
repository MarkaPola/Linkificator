
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

// Handle dynamic document changes using MutationObserver interface
var documentObserver = (function () {
    let config = {childList: true, subtree: true};
    let observing = false;
    let delay = 300;
    
    let observer = new MutationObserver ((function () {
        observing = false;
        observer.disconnect();
        
        setTimeout(function() {
            self.port.emit('document-changed');
        }, delay);
    }).bind(this));

    return {
        observe: function (timeout) {
            observing = true;
            delay = timeout === undefined ? 300 : timeout;
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
            if (regex.charAt(index) == '\\') {
                ++index;
                continue;
            }
            if (regex.charAt(index) == '[') {
                inSet = true;
                continue;
            }
            if (regex.charAt(index) == ']') {
                inSet = false;
                continue;
            }
            if (regex.charAt(index) == '(' && !inSet) {
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

    const start_uri_delimiter = "\\s.,;:!?#&()（）[\\]{}'\"`<>«»“”‘’";
    const end_uri_delimiter = "\\s.,;:!()（）{}'\"`<>«»“”‘’";

    const start_path_delimiter = "/\\?#";
    
    const domain_element = "(?:[^-@\\s()<>[\\]{}/.:](?:[^@\\s()<>[\\]{}/.:]{1,}[^-@\\s()<>[\\]{}/.:]|[^-@\\s()<>[\\]{}/.:])?)";
    const tld = "(?:\\.(?:" + properties.predefinedRules.topLevelDomains.join('|') + ")(?=(?:$|[" + start_path_delimiter + end_uri_delimiter + "])))";
            
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
    function AboutRule () {
        PatternRule.call(this, "(about:[\\w?=-]+)");
    }
    AboutRule.prototype = new PatternRule;
    AboutRule.prototype.test = function(regex) {
        return properties.predefinedRules.support.about.active && regex[this._index] !== undefined;
    };
    AboutRule.prototype.getURL = function(regex) {
        if (regex[this._index])
            return regex[this._index];
        else
            return null; 
    };
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
    
    var pattern = Pattern ("(^|[" + start_uri_delimiter + "]+)");
    if (properties.customRules.support.before)
        buildCustomRules(pattern, properties.customRules.rules.beforeList);
    if (properties.predefinedRules.support.about.active)
        pattern.push(new AboutRule);
    pattern.push(new FullMailRule);
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
        const PAGES = ["about", "addons", "apps", "cache", "compartments", "config", "crashes",
                       "memory", "newtab", "permissions", "plugins", "preferences", "privatebrowsing",
                       "sessionrestore", "support", "sync-log", "sync-progress", "sync-tabs"];
        function isAboutURL (url) {
            let about = "about:";
            if (url.indexOf(about) == 0) {
                let page = url.substr(about.length);
                
                return PAGES.some(function(item) {return item.indexOf(page) == 0;});
            } else {
                return false;
            }
        }

        function openURL (event) {
            if (event.button == 2 || event.altKey || event.ctrlKey || event.metaKey)
                // no custom action, propagate this event
                return true;

            event.stopPropagation();
            event.preventDefault();

            self.port.emit('open-url', {button: event.button == 0 ? 'left' : 'middle', url: this.href});

            return false;
        }

        let anchor = this.document.createElement('a');
        anchor.setAttribute('title', 'Linkificator: ' + url);
        anchor.setAttribute('href', url);
        anchor.setAttribute('class', 'linkificator-ext');
        if (this.style.length != 0) {
            anchor.setAttribute('style', this.style);
        }
        if (isAboutURL(url)) {
            // attach special action to enable about: page opening on mouse click
            anchor.addEventListener('mouseup', openURL, false);
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

    return this.index == this.textNode.length;
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

    return this.index == this.textNodes.length;
};

function execute (action, properties) {
    var document = window.document;

    var state = State(document, action);
    if (!state) {
        return;
    }

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

    function parse () {
        function parseDocument (getNodes, linkify) {
            function Snapshot (elements) {
                this.elements = elements;
                this.size = elements.snapshotLength;
                
                for (let index = 0; index < this.size; ++index) {
                    yield this.elements.snapshotItem(index);
                }
            }
            let snapshot = new Snapshot(getNodes(document));
            let count = 0;
            
            function nextNode () {
                count += 1;
                if (count > properties.processing.iterations) {
                    count = 1;
                    setTimeout(parseNode, properties.processing.interval);
                } else {
                    parseNode();
                }
            }
            function parseNode () {
                try
                {
                    let thread = Thread(new linkify(snapshot.next(), statistics, properties, parser, style, nextNode),
                                        properties.processing.interval);
                    threads.push(thread);
                    thread.start();
                } catch (e) {
                    if (e instanceof StopIteration)
                        // end of iteration
                        return;
                    else {
                        throw e;
                    }
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
    }
    
    parse();
}

function undo () {
    var document = window.document;

    var state = State(document, 'undo');
    if (!state) {
        return;
    }

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

self.port.on('parse', function (properties) {
    documentObserver.disconnect();
    execute('parse', properties);
    if (properties.extraFeatures.support.automaticLinkification) {
        documentObserver.observe(properties.extraFeatures.autoLinkificationDelay);
    }
});

self.port.on('re-parse', function (properties) {
    documentObserver.disconnect();
    execute('re-parse', properties);
    if (properties.extraFeatures.support.automaticLinkification) {
        documentObserver.observe(properties.extraFeatures.autoLinkificationDelay);
    }
});

self.port.on('undo', function (properties) {
    documentObserver.disconnect();
    undo();
});

self.port.on('get-statistics', function () {
    self.port.emit('statistics', Statistics(window.document, 'get-statistics').get());
});
