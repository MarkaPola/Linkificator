
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The main module of the Linkificator Add-on.
// author: MarkaPola

const webext = require("sdk/webextension");

function sendPreferences (port) {
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
        
        let result = [];
        for (let element of data.split(';')) {
			let protocol = Element(element);
			if (protocol)
				result.push (protocol);
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
		
        let result = [];
        for (let element of data.split(';')) {
			let subdomain = Element(element);
			if (subdomain)
				result.push (subdomain);
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
    function splitTopLevelDomains (data) {
        return data.split(';').sort().uniq();
    }

    
    const prefs = require('sdk/simple-prefs').prefs;

    let settings = {};
    
    // convert legacy preferences to webextension format
    settings.manual = prefs.manual;
    settings.contextMenuIntegration = prefs.contextMenuIntegration;

    settings.hotkeys = {
        toggle: prefs.hotkeyToggle, 
        manual: prefs.hotkeyManual, 
        manage: prefs.hotkeyManage, 
        parse: prefs.hotkeyParse
    };
    
    settings.domains = {
		useRegExp: prefs.useRegExp,
		type: prefs.filterMode,
		list: {
            white: prefs.whitelist.split(' '),
			black: prefs.blacklist.split(' ')
        }
	};

    settings.style = {
		text: {
            override: prefs.overrideTextColor,
			color: prefs.linkColor
        },
		background: {
            override: prefs.overrideBackgroundColor,
			color: prefs.backgroundColor
        }
	};

    settings.predefinedRules = {
		support: {
            email: {
                active: prefs.supportEmail,
                useTLD: prefs.emailUseTLD
            }, 
			standard: {
                active: prefs.supportStandardURLs,
                useSubdomains: prefs.standardURLUseSubdomains,
                useTLD: prefs.standardURLUseTLD,
                linkifyAuthority: prefs.standardURLlinkifyAuthority
            }
        },
		protocols: splitProtocols(prefs.protocols),
		subdomains: splitSubdomains(prefs.subdomains),
		excludedElements: splitExcludedElements(prefs.excludedElements)
	};

    settings.topLevelDomains = {
        generics: {
            active: prefs.useGTLDs,
            domains: splitTopLevelDomains(prefs.gTLDs)
        }, 
        countryCodes: {
            active: prefs.useCcTLDs,
            domains: splitTopLevelDomains(prefs.ccTLDs)
        }, 
        geographics: {
            active: prefs.useGeoTLDs,
            domains: splitTopLevelDomains(prefs.geoTLDs)
        }, 
        communities: {
            active: prefs.useCommunityTLDs,
            domains: splitTopLevelDomains(prefs.communityTLDs)
        }, 
        brands: {
            active: prefs.useBrandTLDs,
            domains: splitTopLevelDomains(prefs.brandTLDs)
        }
    };

    settings.customRules = {
		support: {
            before: prefs.supportCustomRulesBefore,
			after: prefs.supportCustomRulesAfter
        },
		rules: JSON.parse(prefs.customRules)
	};

    settings.extraFeatures = {
		support: {
            inlineElements: prefs.supportInlineElements,
            automaticLinkification: prefs.automaticLinkification
        },
		inlineElements: prefs.inlineElements.split(";"),
        maxDataSize: prefs.maxDataSize,
        autoLinkification: {
            delay: prefs.autoLinkificationDelay,
            interval: {
                active: prefs.autoLinkificationInterval,
                value: prefs.autoLinkificationIntervalValue
            },
            threshold: {
                active: prefs.autoLinkificationThreshold,
                value: prefs.autoLinkificationThresholdValue
            }
        }
    };

	try {
		settings.processing = JSON.parse(prefs.processing);
	} catch (e) {
		// erroneous JSON, use default
		settings.processing = {interval: 10, iterations: 40};
	}

    port.postMessage({
        config: {
            sync: prefs.sync, 
            activated: prefs.activated
        },
        preferences: settings
    });
}


webext.startup().then(({browser}) => {
  browser.runtime.onConnect.addListener(port => {
    if (port.name === "sync-preferences") {
      sendPreferences(port);
    }
  });
});
