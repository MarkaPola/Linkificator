
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

	// build properties from preferences
	var simplePrefs = require('sdk/simple-prefs');
	var prefs = simplePrefs.prefs;
	var preferencesService = require("sdk/preferences/service");

	var properties = {requiredCharacters: [":", "/", "@"]};

	try {
		properties.processing = JSON.parse(prefs.processing);
	} catch (e) {
		// erroneous JSON, use default
		properties.processing = {interval: 10, iterations: 3};
	}

	properties.domains = {
		regexp: prefs.useRegExp,
		type: prefs.filterMode,
		list: {white: prefs.whitelist.split(' '),
			   black: prefs.blacklist.split(' ')}
	};

	properties.style = {
		text: {override: prefs.overrideTextColor,
			   color: prefs.linkColor},
		background: {override: prefs.overrideBackgroundColor,
					 color: prefs.backgroundColor}
	};

	properties.predefinedRules = {
		support: {email: prefs.supportEmail,
				  about: prefs.supportAbout,
				  standard: prefs.supportStandardURLs},
		protocols: splitProtocols(prefs.protocols),
		subdomains: splitSubdomains(prefs.subdomains),
		excludedElements: splitExcludedElements(prefs.excludedElements)
	};

	properties.customRules = {
		support: {before: prefs.supportCustomRulesBefore,
				  after: prefs.supportCustomRulesAfter},
		rules: JSON.parse(prefs.customRules)
	};

	properties.extraFeatures = {
		support: {inlineElements: prefs.supportInlineElements},
		inlineElements: prefs.inlineElements.split(";")
	};

	// handle events for various preferences changes
	const SYNC_PREFIX = "services.sync.prefs.sync.extensions.linkificator@markapola.";
	const SYNC_PROPERTIES = ["hotkeyToggle",
							 "hotkeyParse",
							 "displayWidget",
							 "useRegExp",
							 "filterMode",
							 "whitelist",
							 "blacklist",
							 "overrideTextColor",
							 "linkColor",
							 "overrideBackgroundColor",
							 "backgroundColor",
							 "supportEmail",
							 "supportAbout",
							 "supportStandardURLs",
							 "supportInlineElements",
							 "supportCustomRulesBefore",
							 "supportCustomRulesAfter",
							 "customRules",
							 "protocols",
							 "subdomains",
							 "excludedElements",
							 "inlineElements"];

	simplePrefs.on('sync', function () {
		let state = prefs.sync;
		SYNC_PROPERTIES.forEach (function (element, index, array) {
			preferencesService.set(SYNC_PREFIX+element, state);
		}, this);
	});

	simplePrefs.on('processing', function () {
		try {
			properties.processing = JSON.parse(prefs.processing);
		} catch (e) {
			// erroneous JSON, use default
			properties.processing = {interval: 10, iterations: 3};
		}
	});

	simplePrefs.on('useRegExp', function () {
		properties.domains.regexp = prefs.useRegExp;
	});
	// selection of filtering mode
	simplePrefs.on('filterMode', function () {
		properties.domains.type = prefs.filterMode;
	});
	// manage domains list edition
	simplePrefs.on('whitelist', function () {
		properties.domains.list.white = prefs.whitelist.split(' ');
	});
	simplePrefs.on('blacklist', function () {
		properties.domains.list.black = prefs.blacklist.split(' ');
	});
	// management of colors
	simplePrefs.on('overrideTextColor', function () {
		properties.style.text.override = prefs.overrideTextColor;
	});
	simplePrefs.on ('linkColor', function () {
		properties.style.text.color = prefs.linkColor;
	});
	simplePrefs.on('overrideBackgroundColor', function () {
		properties.style.background.override = prefs.overrideBackgroundColor;
	});
	simplePrefs.on('backgroundColor', function () {
		properties.style.background.color = prefs.backgroundColor;
	});

	// manage advanced settings
	simplePrefs.on('supportEmail', function () {
		properties.predefinedRules.support.email = prefs.supportEmail;
	});
	simplePrefs.on('supportAbout', function () {
		properties.predefinedRules.support.about = prefs.supportAbout;
	});
	simplePrefs.on('supportStandardURLs', function () {
		properties.predefinedRules.support.standard = prefs.supportStandardURLs;
	});
	simplePrefs.on('protocols', function () {
		properties.predefinedRules.protocols = splitProtocols(prefs.protocols);
	});
	simplePrefs.on('subdomains', function () {
		properties.predefinedRules.subdomains = splitSubdomains(prefs.subdomains);
	});
	simplePrefs.on('excludedElements', function () {
		properties.predefinedRules.excludedElements = splitExcludedElements(prefs.excludedElements);
	});

	simplePrefs.on('supportCustomRulesBefore', function () {
		properties.customRules.support.before = prefs.supportCustomRulesBefore;
	});
	simplePrefs.on('supportCustomRulesAfter', function () {
		properties.customRules.support.after = prefs.supportCustomRulesAfter;
	});
	simplePrefs.on('customRules', function () {
		properties.customRules.rules = JSON.parse(prefs.customRules);
	});

	simplePrefs.on('supportInlineElements', function () {
		properties.extraFeatures.support.inlineElements = prefs.supportInlineElements;
	});
	simplePrefs.on('inlineElements', function () {
		properties.extraFeatures.inlineElements = prefs.inlineElements.split(";");
	});

	// handle user setting from previous versions settings
	if (preferencesService.isSet('extensions.linkificator@markapola.hotkey')) {
		preferencesService.set('extensions.linkificator@markapola.hotkeyToggle',
							   preferencesService.get('extensions.linkificator@markapola.hotkey',
													  "control-shift-y"));
		preferencesService.reset('extensions.linkificator@markapola.hotkey');
	}

	if (preferencesService.isSet('extensions.linkificator@markapola.useWhitelist')) {
		preferencesService.reset('extensions.linkificator@markapola.useWhitelist');
		preferencesService.reset('extensions.linkificator@markapola.useBlacklist');

		prefs.filterMode = 'white';
	}

    return {
        get properties () {
            return properties;
        },
        
        linkifyURL: function (URL) {
			if (properties.domains.type == 'none')
				return true;

			let useRegex = properties.domains.regexp;
            let flag = properties.domains.type == 'white';
			let list = properties.domains.list[properties.domains.type];

			let index = 0;
			while (index != list.length) {
				if (useRegex) {
					if (URL.match(new RegExp(list[index++], "i"))) {
						return flag;
					}
				} else {
					if (URL.toLowerCase().indexOf(list[index++]) != -1) {
						return flag;
					}
				}
			}
			
            return !flag;
        }
    };
}

exports.Configurator = Configurator;
