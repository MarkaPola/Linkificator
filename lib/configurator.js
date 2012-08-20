
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// configurator.js - Linikificator's module
// author: MarkaPola

//
// Manage all settings/options/properties of the add-on
//

function Configurator () {

    function splitProtocols (data) {
        function Element (data) {
            let parts1 = data.split('~');
			if (parts1.length != 2) {
				return null;
			}

			let parts2 = parts1[1].split('#');
			let count = 2;

			if (parts2.length == 2) {
				count = parseInt(parts2[1]);
			}

			let trailer = ":";
			for (let index = 0; index < count; ++index) {
				trailer += "/";
			}

			return {
				pattern: parts1[0]+trailer,
				term: parts2[0]+trailer
			};
        }
        
        let elements = data.split(';');
        let result = [];
        for (let index = 0; index < elements.length; ++index) {
			let element = Element(elements[index]);
			if (element)
				result.push (element);
        }
        
        return result;
    }
    function splitSubdomains (data) {
        function Element (data) {
            let parts = data.split('~');
			if (parts.length == 3) {
				return {
					filter: parts[0],
					pattern: parts[1],
					term: parts[2]
				};
			}
			else {
				return null;
			}
		}
		
        let elements = data.split(';');
        let result = [];
        for (let index = 0; index < elements.length; ++index) {
			let element = Element(elements[index]);
			if (element)
				result.push (element);
        }
        
        return result;
    }
    function splitExcludedElements (data) {
		let elements = data.split(';');

        for (let index = 0; index < elements.length; ++index) {
			let element = elements[index];
			if (element.charAt(0) == '@')
				elements[index] = '*[' + element + ']';
        }

		return elements;
	}

    function clone (source, target) {
        let target = target || {};
        
        for (let i in source) {
            if (typeof source[i] === 'object') {
                target[i] = (source[i].constructor === Array)?[]:{};
                clone(source[i], target[i]);
            } else {
                target[i] = source[i];
            }
        }
        return target;
    }
    
    const PROTOCOLS = "h..p~http#2;h..ps~https#2;ftp~ftp#2;news~news#0;nntp~nntp#2;telnet~telnet#2;irc~irc#2;file~file#3";
    const SUBDOMAINS = "www~www\\d{0,3}~http://;ftp~ftp~ftp://;irc~irc~irc://";
    const EXCLUDED_ELEMENTS = "a;applet;area;embed;frame;frameset;head;iframe;img;map;meta;noscript;object;option;param;script;select;style;textarea;title;@onclick;@onmousedown;@onmouseup";

    var defaults = {
        rawData: {
			protocols: PROTOCOLS,
			subdomains: SUBDOMAINS,
			excludedElements: EXCLUDED_ELEMENTS
		},

        domainList: {type: 'black', regexp: false, domains: ['localhost', 'google.com']},
        excludedElements: splitExcludedElements(EXCLUDED_ELEMENTS),

        protocols: splitProtocols(PROTOCOLS),
        subdomains: splitSubdomains(SUBDOMAINS),
        
        requiredCharacters: [":", "/", "@"],

        style: {text: {override: false, color: '#006620'}, background: {override: false, color: '#fff9ab'}},

        support: {email: true, about: false}
    };
    
    var currents = clone(defaults);
	// raw data management
	currents.raw = {
		support: {
			get email () { return currents.support.email; },
			set email (data) { currents.support.email = data; },

			get about () { return currents.support.about; },
			set about (data) {
				currents.support.about = data;
				if (data) {
					currents.protocols.push({pattern: "about:", term: "about:" });
				} else {
					currents.protocols.pop();
				}
			}
		},

		get protocols () { return currents.rawData.protocols; },
		set protocols (data) {
			currents.rawData.protocols = data;
			currents.protocols = splitProtocols(currents.rawData.protocols);
		},

		get subdomains () { return currents.rawData.subdomains; },
        set subdomains (data) {
			currents.rawData.subdomains = data;
			currents.subdomains = splitSubdomains(currents.rawData.subdomains);
		},

		get excludedElements () { return currents.rawData.excludedElements; },
        set excludedElements (data) {
			currents.rawData.excludedElements = data;
			currents.excludedElements = splitExcludedElements(currents.rawData.excludedElements);
		},

		defaults: {
			get protocols () { return defaults.rawData.protocols; },

			get subdomains () { return defaults.rawData.subdomains; },
			
			get excludedElements () { return defaults.rawData.excludedElements; }
		}
	};

    return {
        get properties () {
            return currents;
        },
        
        reset: function () {
            clone (defaults, currents);
        },
        
        linkifyURL: function (URL) {
            flag = currents.domainList.type == 'white';
            
            index = currents.domainList.domains.length - 1;            
            while (index != -1)
            {
				if ((currents.domainList.regexp && URL.match(RegExp(currents.domainList.domains[index--],"i")))
					|| URL.toLowerCase().indexOf(currents.domainList.domains[index--]) != -1) {
                    return flag;
                }
            }
            
            return !flag;
        }
    };
}

exports.Configurator = Configurator;
