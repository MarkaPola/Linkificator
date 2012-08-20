
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
            result.push ({regex: RegExp("^"+data[index].pattern+"$","i"), term: data[index].term});
        }
        
        return result;
    }
    
    var protocol_matcher = buildMatcher (properties.protocols);
    var subdomain_matcher = buildMatcher (properties.subdomains);

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
	function SubPattern (text, captures, matcher) {
		var index = 0;

		return {
			set start (value) { index = value; },
			get count () { return captures; },
			get pattern () { return text; },

			test: function (regex) {
				return matcher.test(regex, index);
			},
			getURL: function (regex) {
				return matcher.match(regex, index);
			}
		}
	}

	function Pattern (prefix, count) {
		var index = count+2;
		var pattern = prefix + "(";
		var subpatterns = [];

		var first = true;

		var URLregex;
		var result = null;

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
				URLregex = RegExp (pattern, 'i');
			},

			match: function (text) {
				let index = 0;
				let data = text;
				let valid = false;

				while (!valid) {
					if (!(result = URLregex.exec (data)))
						break;

					for (let i = 0; i < subpatterns.length; ++i) {
						if (valid = subpatterns[i].test(result)) {
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
					}
				} else {
					return null;
				}
			}
		}
	}

    // regexps are based on various RFC, mainly 1738, 822, 1036 and 2732
    const IPv4 = "(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)";
    const IPv6 = "(?:\\[(?:(?:(?:[0-9a-f]{1,4}:){7}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){6}:[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){5}:(?:[0-9a-f]{1,4}:)?[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){4}:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){3}:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){2}:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){6}(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:(?:[0-9a-f]{1,4}:){0,5}:(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:::(?:[0-9a-f]{1,4}:){0,5}(?:(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b).){3}(?:b(?:(?:25[0-5])|(?:1d{2})|(?:2[0-4]d)|(?:d{1,2}))b))|(?:[0-9a-f]{1,4}::(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})|(?:::(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})|(?:(?:[0-9a-f]{1,4}:){1,7}:))\\])";
    const IP = "(?:" + IPv4 + "|" + IPv6 + ")";

    const protocol = "(" + buildPattern(properties.protocols) + ")";

    const authentication = "(?:[\\w%$#&_\\-]+(?::[^@:/\\s]+)?@)";
    const full_authentication = "(?:[\\w%$#&_\\-]+:[^@:/\\s]+@)";
    
	const domain_element = "[^0-9\\s()<>[\\]{}/.:][^\\s()<>[\\]{}/.:]*";
    const domain = "(?:" + domain_element + "(?:\\." + domain_element + ")*)";
    const full_domain = "(?:" + domain_element + "(?:\\." + domain_element + ")+)";
    const subdomain = "(?:(" + buildPattern(properties.subdomains) + ")\\.)";
    const port = "(?::[\\d]{1,5})?";

    const IP_host = IP + port;
    const domain_host = domain + port;
    const full_domain_host = full_domain + port;

    const subpath = "(?:(?:(?:[^\\s()<>]+|\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\))+(?:\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[{};:'\".,<>?«»“”‘’]))|[^\\s`!()\\[{};:'\".,<>?«»“”‘’])"

	var mail_pattern = SubPattern("((?:[\\w\\-_.!#$%&'*+/=?^`{|}~]+@)" + "(?:" + domain + "|" + IP + "))", 1,
								  {
									  test: function (regex, index) {
										  return properties.support.email && regex[index] !== undefined;
									  },
									  match: function (regex, index) {
										  if (regex[index])
											  return "mailto:" + regex[index];
										  else
											  return null;
									  }
								  });
	var full_mail_pattern = SubPattern("(?:(mailto):" + mail_pattern.pattern + ")", 1+mail_pattern.count,
									   {
										   test: function (regex, index) {
											   return properties.support.email && regex[index] !== undefined;
										   },
										   match: function (regex, index) {
											   if (regex[index])
												   return "mailto:" + regex[index+1];
											   else
												   return null;
										   }
									   });

	var full_protocol_pattern = SubPattern("(" + protocol + authentication + "?" + "(?:" + domain_host + "|" + IP_host + ")" + subpath + "?)", 2,
										   {
											   test: function (regex, index) {
												   return regex[index] !== undefined;
											   },
											   match: function (regex, index) {
												   let protocol_index = index+1;
												   if (regex[index])
													   // url includes the protocol
													   return regex[index].replace(regex[protocol_index], getProtocol(regex[protocol_index]));
												   else
													   return null;
											   }
										   });
	var auth_domain_pattern = SubPattern("(" + full_authentication + "(?:" + subdomain + domain_host + "|" + domain_host + "|" + IP_host + ")" + subpath + "?)", 2,
										   {
											   test: function (regex, index) {
												   return regex[index] !== undefined;
											   },
											   match: function (regex, index) {
												   let subdomain_index = index+1;
												   if (regex[index]) {
													   if (regex[subdomain_index]) {
														   // protocol less url with known subdomain
														   // Deduce protocol from the subdomain
														   return getDomainProtocol(regex[subdomain_index]) + regex[index];
													   } else {
														   // protocol less url, assume http
														   return "http://" + regex[index];
													   }
												   } else {
													   return null;
												   }
											   }
										   });
	var domain_pattern = SubPattern("(" + authentication + "?(?:" + subdomain + domain_host + "|(?:" + full_domain_host + "|" + IP_host + ")/)" + subpath + "?)", 2,
										   {
											   test: function (regex, index) {
												   return regex[index] !== undefined;
											   },
											   match: function (regex, index) {
												   let subdomain_index = index+1;
												   if (regex[index]) {
													   if (regex[subdomain_index]) {
														   // protocol less url with known subdomain
														   // Deduce protocol from the subdomain
														   return getDomainProtocol(regex[subdomain_index]) + regex[index];
													   } else {
														   // protocol less url, assume http
														   return "http://" + regex[index];
													   }
												   } else {
													   return null;
												   }
											   }
										   });

	var pattern = Pattern ("(^|[\\s()<>«“]+)", 1);
	pattern.push(full_mail_pattern);
	pattern.push(full_protocol_pattern);
	pattern.push(auth_domain_pattern);
	pattern.push(domain_pattern);
	pattern.push(mail_pattern);
	pattern.compile();

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
			return pattern.match(text);
		}
    }
}

function Linkify (node, parser, startTime, style) {
	var count = 0;
    var document = node.ownerDocument;
    var parent = node.parentNode;
    var sibling = node.nextSibling;
    var text = node.nodeValue;

	function openURL (event) {
		if (event.button == 2 || event.altKey || event.ctrlKey || event.metaKey)
			// no custom action, propagate this event
			return true;

		event.stopPropagation();
		event.preventDefault();

		self.port.emit('open-url', {button: event.button == 0 ? 'left' : 'middle', url: this.href});

		return false;
	}

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

            let url = match.url;
            let anchor = document.createElement('a');
			anchor.setAttribute('title', 'Linkificator: ' + url);
			anchor.setAttribute('href', url);
			anchor.setAttribute('class', 'linkificator-ext');
			if (style.length != 0) {
				anchor.setAttribute('style', style);
			}
			if (url.indexOf("about:") == 0) {
				// attach special action to enable about: page opening on mouse click
				anchor.addEventListener('mouseup', openURL, false);
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

self.port.on('parse', function (properties) {
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
