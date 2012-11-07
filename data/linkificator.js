
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Linkification core - Linkificator's module
 * author: MarkaPola */


var statistics = Statistics();

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
				if (regex.indexOf("?:", index) != index+1)
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
	}

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
					if (!(result = URLregex.exec (data))) {
						break;
					}

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

    const protocol = "(" + buildPattern(properties.predefinedRules.protocols) + ")";

    const authentication = "(?:[\\w%$#&_\\-]+(?::[^@:/\\s]+)?@)";
    const full_authentication = "(?:[\\w%$#&_\\-]+:[^@:/\\s]+@)";
    
	const domain_element = "[^0-9\\s()<>[\\]{}/.:][^\\s()<>[\\]{}/.:]*";
    const domain = "(?:" + domain_element + "(?:\\." + domain_element + ")*)";
    const full_domain = "(?:" + domain_element + "(?:\\." + domain_element + ")+)";
    const subdomain = "(?:(" + buildPattern(properties.predefinedRules.subdomains) + ")\\.)";
    const port = "(?::[\\d]{1,5})?";

    const IP_host = IP + port;
    const domain_host = domain + port;
    const full_domain_host = full_domain + port;

    const subpath = "(?:(?:(?:[^\\s()<>]+|\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\))+(?:\\((?:[^\\s()<>]+|(?:\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[{};:'\".,<>?«»“”‘’]))|[^\\s`!()\\[{};:'\".,<>?«»“”‘’])"

	// define sub-classes from PatternRule for the various URI formats
	function AboutRule () {
		PatternRule.call(this, "(about:[\\w?=-]+)");
	}
	AboutRule.prototype = new PatternRule;
	AboutRule.prototype.test = function(regex) {
		return properties.predefinedRules.support.about && regex[this._index] !== undefined;
	};
	AboutRule.prototype.getURL = function(regex) {
		if (regex[this._index])
			return regex[this._index];
		else
			return null; 
	};
	///// e-mail without protocol specification
	function MailRule () {
		PatternRule.call(this, "((?:[\\w\\-_.!#$%&'*+/=?^`{|}~]+@)" + "(?:" + domain + "|" + IP + "))");
	}
	MailRule.prototype = new PatternRule;
	MailRule.prototype.test = function(regex) {
		return properties.predefinedRules.support.email && regex[this._index] !== undefined;
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
		PatternRule.call(this, "(" + protocol + authentication + "?" + "(?:" + domain_host + "|" + IP_host + ")" + subpath + "?)");
	}
	FullProtocolRule.prototype = new PatternRule;
	FullProtocolRule.prototype.test = function(regex) {
		return properties.predefinedRules.support.standard && regex[this._index] !== undefined;
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
		PatternRule.call(this, "(" + full_authentication + "(?:" + subdomain + domain_host + "|" + domain_host + "|" + IP_host + ")" + subpath + "?)");
	}
	AuthenticatedDomainRule.prototype = new PatternRule;
	AuthenticatedDomainRule.prototype.test = function(regex) {
		return properties.predefinedRules.support.standard && regex[this._index] !== undefined;
	};
	AuthenticatedDomainRule.prototype.getURL = function(regex) {
		if (regex[this._index]) {
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
			return null;
		}
	};
	///// protocol-less url with optional authentication
	function DomainRule () {
		AuthenticatedDomainRule.call(this);
		this.pattern = "(" + authentication + "?(?:" + subdomain + domain_host + "|(?:" + full_domain_host + "|" + IP_host + ")/)" + subpath + "?)";
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

	var pattern = Pattern ("(^|[\\s()<>«“]+)");
	if (properties.customRules.support.before)
		buildCustomRules(pattern, properties.customRules.rules.beforeList);
	if (properties.predefinedRules.support.about)
		pattern.push(new AboutRule);
	pattern.push(new FullMailRule);
	pattern.push(new FullProtocolRule);
	pattern.push(new AuthenticatedDomainRule);
	pattern.push(new DomainRule);
	pattern.push(new MailRule);
	if (properties.customRules.support.after)
		buildCustomRules(pattern, properties.customRules.rules.afterList);
	pattern.compile();
	
	var query =  "//text()[ancestor::body and not(ancestor::" + properties.predefinedRules.excludedElements.join(" or ancestor::")
		+ ") and not(ancestor::*[@style[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'display:none')]]) and (";
    if (properties.predefinedRules.subdomains) {
		for (let index = 0; index < properties.predefinedRules.subdomains.length; ++index) {
			let subdomain = properties.predefinedRules.subdomains[index].filter;
			query += "contains(translate(., '" + subdomain.toUpperCase() + "', '" + subdomain.toLowerCase() + "'), '" + subdomain.toLowerCase() + "') or ";
		}
	}
	query += "contains(., '" + properties.requiredCharacters.join ("') or contains(., '") + "'))]";

	var query2 =  "(//" + properties.extraFeatures.inlineElements.join("|//") + ")[ancestor::body and not(ancestor::" + properties.extraFeatures.inlineElements.join(" or ancestor::") + ") and not(ancestor::" + properties.predefinedRules.excludedElements.join(" or ancestor::")
		+ ") and not(ancestor::*[@style[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'display:none')]])]/..";

    return {
        textNodes: function (document) {
			return document.evaluate (query, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        },

        splittedTextNodes: function (document) {
			return document.evaluate (query2, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        },

		match: function (text) {
			return pattern.match(text);
		}
    }
}

function Linkify (document, properties, style, completed) {
	if (document) {
		let ref = this;
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
			
			complete: function () {
				self.port.emit('complete', ref.count);

				if (completed)
					completed();
			},
			
			abort: function () {
				// nothing to do
			}
		}
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
}

// To linkify text nodes.
function LinkifyNode (node, properties, parser, style, completed) {
	if (node) {
		this.parser = parser;

		this.node = node;
		this.parent = node.parentNode;
		this.sibling = node.nextSibling;
		this.text = node.nodeValue;

		return Linkify.call(this, node.ownerDocument, properties, style, completed);
	}
}
LinkifyNode.prototype = new Linkify;
LinkifyNode.prototype.linkify = function (isOver) {
	var matched = false;
	var iterations = 0;
	
    for (let match = null;
         !isOver(iterations) && (match = this.parser.match(this.text));
         ++iterations, ++this.count) {
    	if (!matched) {
			matched = true;
			this.parent.removeChild(this.node);
		}
		
		this.parent.insertBefore(this.document.createTextNode(this.text.substring(0, match.index)), this.sibling);

		let anchor = this.newAnchor(match.url);
		anchor.appendChild(this.document.createTextNode(match.text));
		this.parent.insertBefore(anchor, this.sibling);
		
		this.text = this.text.substr(match.index + match.length);
	}
	
	if (matched) {
		this.node = this.document.createTextNode(this.text);
		this.parent.insertBefore(this.node, this.sibling);
	}
	
    return !isOver(iterations);
}

// To linkify URLs splitted on multiple text nodes
function LinkifySplittedText (node, properties, parser, style, completed) {
	if (node) {
		this.parser = parser;

		// parse current node to list "root" nodes of splitted urls
		function TextNode () {
			this._text = "";
			this._nodes = [];
		}
		TextNode.prototype = {
			get text () {
				return this._text;
			},
			add: function (node) {
				this._nodes.push({index: this._text.length, node: node});
				this._text += node.nodeValue;
			},
			match: function (start, end) {
				return this._nodes.filter(
					function (element, index, array) {
						let max = element.index + element.node.nodeValue.length;
						return (start >= element.index && start <= max)
							|| (end >= element.index && end <= max)
							|| (start < element.index && end > max);
					});
			}
		};

		function TextNodes () {
			Array.call(this);
			this.new();
		}
		TextNodes.prototype = Object.create(new Array, {
			current: {
				get: function() { return this[this.length-1];}
			},
			'new': {
				value: function(){this.push(new TextNode);}
			}
		});

		this.textNodes = (function parse (node) {
			const inline = new RegExp(properties.extraFeatures.inlineElements.join("|"),"i");
			var textNodes = new TextNodes;
			
			function walk (node) {
				var list = node.childNodes;

				for (let index = 0; index < list.length; ++index) {
					let child = list.item(index);
					if (child.nodeType == 3) // Text node
						textNodes.current.add(child);
					else if (child.nodeName.search(inline) != -1)
						walk(child);
					else {
						textNodes.new();
						continue;
					}
				}
			}
			walk(node);

			return textNodes;
		})(node);
		this.index = 0;

		return Linkify.call(this, node.ownerDocument, properties, style, completed);
	}
}
LinkifySplittedText.prototype = new Linkify;
LinkifySplittedText.prototype.linkify = function (isOver) {
	var iterations = 0;

	for (; !isOver(iterations) && this.index < this.textNodes.length; ++iterations, ++this.index) {
		let textNode = this.textNodes[this.index];

		let start = 0;
		let match = null;

		while (match = this.parser.match(textNode.text.substring(start))) {
			let pos = start + match.index;
			start =  pos + match.length;
			let url = match.url;

			// retrieve list of nodes impacted by url
			let list = textNode.match(pos, pos+match.length);
			// ignore not splitted url
			if (list.length < 2) continue;

			this.count++;

			// first node must be splitted
			let element = list[0];
			let node = element.node;
			let parent = node.parentNode;
			parent.insertBefore(this.document.createTextNode(node.nodeValue.substring(0, pos-element.index)), node);
			let a = this.newAnchor(url);
			a.appendChild(this.document.createTextNode(node.nodeValue.substring(pos-element.index)));
			node.parentNode.replaceChild(a, node);

			// all other nodes, except last one must be simply anchored to <a> node
			//  which replace initial node
			for (let i = 1; i < list.length-1; ++i) {
				let a = this.newAnchor(url);
				let node = list[i].node;
				a.appendChild(node.cloneNode(true));
				node.parentNode.replaceChild(a, node);
			}

			// last node must also be splitted
			element = list[list.length-1];
			node = element.node;
			parent = node.parentNode;
			a = this.newAnchor(url);
			a.appendChild(this.document.createTextNode(node.nodeValue.substring(0, start-element.index)));
			parent.insertBefore(a, node);
			let newNode = this.document.createTextNode(node.nodeValue.substring(start-element.index));
			parent.replaceChild(newNode, node);
			// update descriptor for future treatments
			element.index = start;
			element.node = newNode;
		}
	}
	
    return !isOver(iterations);
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

    var parser = Parser(properties);
	
	function parse (document) {
		var count = 0;

		// function called on completion of splitted text node parsing
		// When all nodes are parsed, start linkification of "standard" text nodes
		function completed () {
			count -= 1;
			if (count <= 0) {
				// second pass: handle not splitted urls
				parseDocument(document, parser.textNodes, LinkifyNode);
			}
		}

		function parseDocument (document, getNodes, linkify, completed) {
			// get list of text nodes
			var elements = getNodes(document);

			let size = elements.snapshotLength;
			count = size;
			if (size == 0) {
				self.port.emit('complete', 0);
				if (completed)
					completed();
			} else {
				for (let index = 0; index < size; ++index) {
					let thread = Thread(new linkify(elements.snapshotItem(index), properties, parser, style, completed),
										properties.processing.interval);
					thread.start();
				}
			}
		}

		if (properties.extraFeatures.support.inlineElements) {
			// start parsing by splitted text nodes
			parseDocument(document, parser.splittedTextNodes, LinkifySplittedText, completed);
		} else {
			parseDocument(document, parser.textNodes, LinkifyNode);
		}
	}
	
	parse(window.document);
});
