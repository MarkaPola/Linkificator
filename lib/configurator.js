
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// configurator.js - Linikificator's module
// author: MarkaPola

//
// Manage all settings/options/properties of the add-on
//

// extends Array functionality
Array.prototype.uniq = function() {
    return this.reduce(function (p, c) {
        if (p.indexOf(c) < 0) p.push(c);
        return p;
    }, []);
};

if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}


function Configurator () {
    "use strict";

    const PREF_PREFIX = "extensions.linkificator@markapola.";

    const self = require('sdk/self');
	const simplePrefs = require('sdk/simple-prefs');
	const prefs = simplePrefs.prefs;
	const preferencesService = require("sdk/preferences/service");

    
    function splitProtocols (data) {
        function Element (data) {
            let parts1 = data.split('~');
			if (parts1.length != 2) {
				return null;
			}

			let parts2 = parts1[1].split('#');
			let count = 2;

			if (parts2.length == 2) {
				count = parseInt(parts2[1], 10);
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
        // update protocols property if needed (remove news description)
        let index = elements.findIndex (function (element, index, array) {
            return element.startsWith('news');
        });
        if (index !== -1) {
            elements.splice(index, 1);
            preferencesService.set(PREF_PREFIX + 'protocols', elements.join(';'));
        }
        
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
    function splitTopLevelDomains () {
        var tlds = [];
        
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined)
                tlds = tlds.concat(arguments[i].split(';'));
        }

        return tlds.sort().uniq();
    }


	// build properties from preferences
    function Properties () {
        if (preferencesService.isSet(PREF_PREFIX + 'processing')) {
            // reset to new values
            preferencesService.reset(PREF_PREFIX + 'processing');
        }
	    try {
		    this.processing = JSON.parse(prefs.processing);
	    } catch (e) {
		    // erroneous JSON, use default
		    this.processing = {interval: 10, iterations: 40};
	    }
    
	    this.domains = {
		    regexp: prefs.useRegExp,
		    type: prefs.filterMode,
		    list: {white: prefs.whitelist.split(' '),
			       black: prefs.blacklist.split(' ')}
	    };

	    this.style = {
		    text: {override: prefs.overrideTextColor,
			       color: prefs.linkColor},
		    background: {override: prefs.overrideBackgroundColor,
					     color: prefs.backgroundColor}
	    };

	    this.requiredCharacters = prefs.requiredCharacters.split("");

	    this.predefinedRules = {
		    support: {email: {active: prefs.supportEmail,
                              useTLD: prefs.emailUseTLD}, 
				      about: {active: prefs.supportAbout},
				      standard: {active: prefs.supportStandardURLs,
                                 useSubdomains: prefs.standardURLUseSubdomains,
                                 useTLD: prefs.standardURLUseTLD,
                                 linkifyAuthority: prefs.standardURLlinkifyAuthority}},
		    protocols: splitProtocols(prefs.protocols),
		    subdomains: splitSubdomains(prefs.subdomains),
		    excludedElements: splitExcludedElements(prefs.excludedElements), 
		    topLevelDomains: splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                  prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                  prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                  prefs.useCommunityTLDs ? prefs.communityTLDs : undefined)
	    };

	    this.customRules = {
		    support: {before: prefs.supportCustomRulesBefore,
				      after: prefs.supportCustomRulesAfter},
		    rules: JSON.parse(prefs.customRules)
	    };

	    this.extraFeatures = {
		    support: {inlineElements: prefs.supportInlineElements,
                      automaticLinkification: prefs.automaticLinkification},
		    inlineElements: prefs.inlineElements.split(";"),
            maxDataSize: prefs.maxDataSize,
            autoLinkification: {delay: prefs.autoLinkificationDelay,
                                interval: {active: prefs.autoLinkificationInterval,
                                           value: prefs.autoLinkificationIntervalValue},
                                threshold: {active: prefs.autoLinkificationThreshold,
                                            value: prefs.autoLinkificationThresholdValue}}
        };
    };
    
	var properties = new Properties();

	// handle events for various preferences changes
	const SYNC_PREFIX = "services.sync.prefs.sync.extensions.linkificator@markapola.";
	const SYNC_PROPERTIES = ["displayWidget",
							 "contextMenuIntegration",
							 "widgetMiddleClick",
							 "widgetRightClick",
                             "hotkeyName",
                             "hotkeyValue",
							 "hotkeyToggle",
							 "hotkeyManage",
							 "hotkeyParse",
							 "useRegExp",
							 "filterMode",
							 "whitelist",
							 "blacklist",
							 "overrideTextColor",
							 "linkColor",
							 "overrideBackgroundColor",
							 "backgroundColor",
							 "supportEmail",
							 "emailUseTLD",
							 "supportAbout",
							 "supportStandardURLs",
							 "standardURLUseSubdomains",
							 "standardURLUseTLD",
							 "standardURLLinkifyAuthority",
							 "supportInlineElements",
							 "automaticLinkification",
                             "autoLinkificationInterval", 
                             "autoLinkificationIntervalValue", 
                             "autoLinkificationThreshold", 
                             "autoLinkificationThresholdValue", 
                             "autoLinkificationDelay", 
							 "supportCustomRulesBefore",
							 "supportCustomRulesAfter",
							 "customRules",
                             "requiredCharacters", 
							 "protocols",
							 "subdomains",
							 "excludedElements",
							 "inlineElements",
							 "maxDataSize",
                             "useGTLDs",
                             "gTLDs",
							 "useCcTLDs",
							 "ccTLDs",
							 "useGeoTLDs",
							 "geoTLDs",
							 "useCommunityTLDs", 
							 "communityTLDs"];

    if (prefs.sync) {
        // enforce all sync properties to ensure new ones have the correct value
		SYNC_PROPERTIES.forEach (function (element, index, array) {
			preferencesService.set(SYNC_PREFIX+element, true);
		}, this);
    }
    
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
		properties.predefinedRules.support.email.active = prefs.supportEmail;
	});
	simplePrefs.on('emailUseTLD', function () {
		properties.predefinedRules.support.email.useTLD = prefs.emailUseTLD;
	});
	simplePrefs.on('supportAbout', function () {
		properties.predefinedRules.support.about.active = prefs.supportAbout;
	});
	simplePrefs.on('supportStandardURLs', function () {
		properties.predefinedRules.support.standard.active = prefs.supportStandardURLs;
	});
	simplePrefs.on('standardURLUseSubdomains', function () {
		properties.predefinedRules.support.standard.useSubdomains = prefs.standardURLUseSubdomains;
	});
	simplePrefs.on('standardURLUseTLD', function () {
		properties.predefinedRules.support.standard.useTLD = prefs.standardURLUseTLD;
	});
	simplePrefs.on('standardURLLinkifyAuthority', function () {
		properties.predefinedRules.support.standard.linkifyAuthority = prefs.standardURLLinkifyAuthority;
	});
	simplePrefs.on('requiredCharacters', function () {
		properties.requiredCharacters = prefs.requiredCharacters.split("");
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

    simplePrefs.on('useGTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
	});
    simplePrefs.on('gTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
	});
    simplePrefs.on('useCcTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
	});
    simplePrefs.on('ccTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
	});
    simplePrefs.on('useGeoTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
	});
    simplePrefs.on('geoTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
	});
    simplePrefs.on('useCommunityTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
	});
    simplePrefs.on('communityTLDs', function () {
		properties.predefinedRules.topLevelDomains = splitTopLevelDomains(prefs.useGTLDs ? prefs.gTLDs : undefined,
                                                                          prefs.useCcTLDs ? prefs.ccTLDs : undefined,
                                                                          prefs.useGeoTLDs ? prefs.geoTLDs : undefined,
                                                                          prefs.useCommunityTLDs ? prefs.communityTLDs : undefined);
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

	simplePrefs.on('maxDataSize', function () {
		properties.extraFeatures.maxDataSize = prefs.maxDataSize;
	});
    
	simplePrefs.on('automaticLinkification', function () {
		properties.extraFeatures.support.automaticLinkification = prefs.automaticLinkification;
	});
	simplePrefs.on('autoLinkificationDelay', function () {
		properties.extraFeatures.autoLinkification.delay = prefs.autoLinkificationDelay;
	});
	simplePrefs.on('autoLinkificationInterval', function () {
		properties.extraFeatures.autoLinkification.interval.active = prefs.autoLinkificationInterval;
	});
	simplePrefs.on('autoLinkificationIntervalValue', function () {
		properties.extraFeatures.autoLinkification.interval.value = prefs.autoLinkificationIntervalValue;
	});
	simplePrefs.on('autoLinkificationThreshold', function () {
		properties.extraFeatures.autoLinkification.threshold.active = prefs.autoLinkificationThreshold;
	});
	simplePrefs.on('autoLinkificationThresholdValue', function () {
		properties.extraFeatures.autoLinkification.threshold.value = prefs.autoLinkificationThresholdValue;
	});
    
	// handle user setting from previous versions settings
	if (preferencesService.isSet(PREF_PREFIX + 'hotkey')) {
		preferencesService.set(PREF_PREFIX + 'hotkeyToggle',
							   preferencesService.get(PREF_PREFIX + 'hotkey',
													  "control-shift-y"));
		preferencesService.reset(PREF_PREFIX + 'hotkey');
	}

	if (preferencesService.isSet(PREF_PREFIX + 'useWhitelist')) {
		preferencesService.reset(PREF_PREFIX + 'useWhitelist');
		preferencesService.reset(PREF_PREFIX + 'useBlacklist');

		prefs.filterMode = 'white';
	}

    if (preferencesService.has(PREF_PREFIX + 'widgetLeftClick')) {
        // update from version 1.*
        // reset mouse bindings
        preferencesService.reset(PREF_PREFIX + 'widgetLeftClick');
        preferencesService.reset(PREF_PREFIX + 'widgetMiddleClick');
        preferencesService.reset(PREF_PREFIX + 'widgetRightClick');
    }

    if (preferencesService.has(PREF_PREFIX + 'topLevelDomains')) {
        // update from version previous version
        // this preference is no longer in use
        preferencesService.reset(PREF_PREFIX + 'topLevelDomains');
    }

    // global settings management
    var settingsHandler = {
        get: function () {
            var data = {version:self.version};
            
            SYNC_PROPERTIES.forEach (function (element, index, array) {
                data[element] = preferencesService.get(PREF_PREFIX + element);
            });
            return JSON.stringify(data);
        },
        set: function (text) {
            var data = JSON.parse(text);
            
            SYNC_PROPERTIES.forEach (function (element, index, array) {
                preferencesService.set(PREF_PREFIX + element, data[element]);
            });

            properties = new Properties();
        },
        
        reset: function () {
            SYNC_PROPERTIES.forEach (function (element, index, array) {
			    preferencesService.reset(PREF_PREFIX + element);
		    });

            properties = new Properties();
        }
    };
    
    return {
        get settings () {
            return settingsHandler;
        },
        
        get properties () {
            // returns a copy (to enable customization) of properties
            return JSON.parse(JSON.stringify(properties));
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
