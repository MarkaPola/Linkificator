
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Linkification core - Linkificator's module
 * author: MarkaPola */


var statistics = Statistics();

// catch backward/forward button event to handle widget update
function postStatistics(event) {
	if (event.persisted)
		self.postMessage(statistics.new(document));
}
window.addEventListener('pageshow', postStatistics, false);


function Parser (properties) {

    function buildPattern (data) {
        var result = "";
        
        for (let index = 0; index < data.length; ++index) {
            result += data[index].pattern;
            if (index != data.length-1) {
                result += "|";
            }
        }
        
        return result;
    }
    
    function buildMatcher (data) {
        var result = [];
        
        for (let index = 0; index < data.length; ++index) {
            result.push ({regex: RegExp("^"+data[index].pattern+"$","i"), term: data[index].term});
        }
        
        return result;
    }
    
    function getTerm (items, data) {
		for (let index = 0; index < items.length; ++index) {
			if (items[index].regex.test(data)) {
				return items[index].term;
			}
		}

		return true;
    }
    function getProtocol (data) {
        return getTerm (protocol_matcher, data);
    }
    function getDomainProtocol (data) {
        return getTerm (subdomain_matcher, data);
    }
    
    // regexps are based on various RFC, mainly 1738, 822, 1036 and 2732
    const IPv4 = "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    const IPv6 = "(?:\\[(?:(?:(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){6}:[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){5}:(?:[0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){4}:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){3}:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){2}:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){6}(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:(?:[0-9a-f]{1,4}:){0,5}:(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:::(?:[0-9a-f]{1,4}:){0,5}(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:[0-9a-f]{1,4}::(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})|(?:::(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){1,7}:))\\])";
    const IP = "(?:" + IPv4 + "|" + IPv6 + ")";

    const protocol = "(" + buildPattern(properties.protocols) + ")";

    const authentication = "(?:[\\w%$#&_\\-]+(?::[^@:/\\s]+)?@)";
    const full_authentication = "(?:[\\w%$#&_\\-]+:[^@:/\\s]+@)";
    
	const domain_element = "[^\\s()<>[\\]{}/.]+";
    const domain = "(?:" + domain_element + "(?:\\." + domain_element + ")*)";
    const subdomain = "(?:(" + buildPattern(properties.subdomains) + ")\\.)";
    const port = "(?::[\\d]{1,5})?";

    const IP_host = IP + port;
    const domain_host = domain + port;

    const subpath = "(?:(?:(?:[^\\s()<>]+|\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\))+(?:\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[{};:'\".,<>?«»“”‘’]))|[^\\s`!()\\[{};:'\".,<>?«»“”‘’])"

    const URL = "(?:" + protocol + authentication + "?" + domain + "(?:/|" + subpath + ")?" +
        "|" + full_authentication + "(?:" + subdomain + domain + "|" + domain_host + "|" + IP_host + ")" + subpath + "?" +
        "|" + authentication + "?(?:" + subdomain + domain + "|(?:" + domain_host + "|" + IP_host + ")/)" + subpath + "?)";
              
    const mail = "((?:[\\w\\-_.!#$%&'*+/=?^`{|}~]+@)" + "(?:" + domain + "|" + IP + "))";
    const protocol_mail = "(?:(mailto):" + mail + ")";
    
    const url_pattern = "(^|[\\s()<>«“]+)(" + protocol_mail + "|" + URL + "|" + mail + ")";

    var URLregex = RegExp (url_pattern, 'i');
    var protocol_matcher = buildMatcher (properties.protocols);
    var subdomain_matcher = buildMatcher (properties.subdomains);
    
    return {
        textNodes: function () {
			if (!document.body) {
				// do not process document without a body tag
				return null;
			}

			let query = "//text()[not(ancestor::" + properties.excludedElements.join(" or ancestor::") + ") and (";
            if (properties.subdomains) {
				for (let index = 0; index < properties.subdomains.length; ++index) {
					let subdomain = properties.subdomains[index].filter;
					query += "contains(translate(., '" + subdomain.toUpperCase() + "', '" + subdomain.toLowerCase() + "'), '" + subdomain.toLowerCase() + "') or ";
				}
			}
			query += "contains(., '" + properties.requiredCharacters.join ("') or contains(., '") + "'))]";
			
			return document.evaluate (query, document.body, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        },
        
        match: function (text) {
            result = URLregex.exec (text);
            if (result) {
                return {
                    get regex() { return result; },
                    get text() { return result[2]; },
                    get index() { return result.index + result[1].length; },
                    get length() { return result[2].length; }
                }
            } else {
                return null;
            }
        },
        
        getURL: function (match) {
            if (match.regex[3]) {
                // this is a fully defined email, including protocol
                return match.regex[2];
            } else if (match.regex[8]) {
                // protocol less email address
                return "mailto:" + match.regex[2];
            } else if (match.regex[5]) {
                // url includes the protocol
                return match.regex[2].replace(match.regex[5], getProtocol(match.regex[5]));
            } else if (match.regex[6] || match.regex[7]) {
                // protocol less url. Deduce protocol from the subdomain
                return getDomainProtocol(match.regex[6]?match.regex[6]:match.regex[7]) + match.regex[2];
            } else {
                // protocol less url, assume http
                return "http://" + match.regex[2];
            }
        }
    }
}

function Linkify (node, parser, startTime, style) {
	var count = 0;
    var document = node.ownerDocument;
    var parent = node.parentNode;
    var sibling = node.nextSibling;
    var text = node.nodeValue;

    function linkify (isOver) {
		let matched = false, iterations = 0;

        for (let match = null;
             !isOver(iterations) && (match = parser.match(text));
             ++iterations, ++count) {
    		if (!matched) {
				matched = true;
				parent.removeChild(node);
			}
			
			parent.insertBefore (document.createTextNode(text.substring(0, match.index)), sibling);

            let url = parser.getURL(match);
            let anchor = document.createElement('a');
			anchor.setAttribute('title', 'Linkificator: ' + url);
			anchor.setAttribute('href', url);
			anchor.setAttribute('class', 'linkificator-ext');
			if (style.length != 0) {
				anchor.setAttribute('style', style);
			}

			anchor.appendChild(document.createTextNode(match.text));
			parent.insertBefore(anchor, sibling);
			
			text = text.substr(match.index + match.length);
		}

		if (matched) {
			node = document.createTextNode(text);
			parent.insertBefore(node, sibling);
		}
		
        return !isOver(iterations);
	}
	
    return {
        execute: function () {
            // return false until text node is fully linkified
            return linkify (function(iterations){return iterations == 3;});
    },
	
        finish: function () {
            linkify (function(iterations){return false;});
        },
        
        complete: function () {
            // store statistics as part of DOM for later retrieval
			let stats = statistics.store(document, count, Date.now() - startTime.getTime());
            
            self.postMessage (stats);
        },
        
        abort: function () {
            // nothing to do
        }
    }
}

self.on('message', function (properties) {
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
	
    var startTime = new Date();
    
    var parser = Parser (properties);
    // get list of text nodes
    var elements = parser.textNodes();
	if (!elements) {
		self.postMessage(statistics.new(0, 0));
		return;
	}

	var node = elements.iterateNext();
	while (node)
	{
		let thread = Thread(Linkify(node, parser, startTime, style));
        thread.start();
		node = elements.iterateNext();
	}
});
