
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// controler.js - Linkificator's module
// author: MarkaPola


//
// Manage UI controling linkificator behavior
//


function Controler (data, configurator) {
	// request various needed modules
	var widgets = require('widget');
	var tabs = require('tabs');
	var preferencesService = require("api-utils/preferences-service");
	var simplePrefs = require('simple-prefs');
	var hotKeys = require('hotkeys');

	var _ = require('l10n').get;


	var properties = configurator.properties;
	// add section to keep ui settings during session
	properties.ui = {};

    var link_off = data.url("widget/link-off.png");
    var link_on = data.url("widget/link-on.png");
    var link_excluded = data.url("widget/link-excluded.png");
        
    var prefs = simplePrefs.prefs;
    
	function createHotKey (combo) {
		return hotKeys.Hotkey({
		combo: combo,
		onPress: function () {
			toggle();
		}
		});
	}

	function createWidget () {
		return  widgets.Widget({
			id: "linkificator@makapola.dev",
			label: "Linkificator",
       
			contentURL: prefs.activated ? link_on : link_off,

			onClick: toggle
		});
	}

	// initialize environment and properties from preferences
	var hotkey = createHotKey(prefs.hotkey);
	var widget = prefs.displayWidget ? createWidget() : null;

	properties.domainList.regexp = prefs.useRegExp;
	if (prefs.useWhitelist) {
		properties.domainList.type = 'white';
		properties.domainList.domains = prefs.whitelist.split(' ');
	} else {
		properties.domainList.type = 'black';
		properties.domainList.domains = prefs.blacklist.split(' ');
	}

	properties.style.text.override = prefs.overrideTextColor;
	properties.style.text.color = prefs.linkColor;
	properties.style.background.override = prefs.overrideBackgroundColor;
	properties.style.background.color = prefs.backgroundColor;

	properties.raw.support.email = prefs.supportEmail;
	properties.raw.support.about = prefs.supportAbout;
	properties.raw.support.standard = prefs.supportStandardURLs;

	properties.customRules.support.before = prefs.supportCustomRulesBefore;
	properties.customRules.support.after = prefs.supportCustomRulesAfter;
	properties.raw.customRules.rules = prefs.customRules;

	properties.raw.protocols = prefs.protocols;
	properties.raw.subdomains = prefs.subdomains;
	properties.raw.excludedElements = prefs.excludedElements;

	// handle events for various preferences changes
	const SYNC_PREFIX = "services.sync.prefs.sync.extensions.linkificator@markapola.";
	const SYNC_PROPERTIES = ["hotkey",
							 "displayWidget",
							 "useRegExp",
							 "useWhitelist",
							 "whitelist",
							 "useBlacklist",
							 "blacklist",
							 "overrideTextColor",
							 "linkColor",
							 "overrideBackgroundColor",
							 "backgroundColor",
							 "supportEmail",
							 "supportAbout",
							 "supportStandardURLs",
							 "supportCustomRulesBefore",
							 "supportCustomRulesAfter",
							 "customRules",
							 "protocols",
							 "subdomains",
							 "excludedElements"];

	simplePrefs.on('sync', function () {
		let state = prefs.sync;
		SYNC_PROPERTIES.forEach (function (element, index, array) {
			preferencesService.set(SYNC_PREFIX+element, state);
		}, this);
	});

	simplePrefs.on('activated', function () {
		setIcon();
	});
	simplePrefs.on('hotkey', function () {
		hotkey.destroy();
		hotkey = createHotKey(prefs.hotkey);
	});

	simplePrefs.on('displayWidget', function () {
		if (prefs.displayWidget) {
			widget = createWidget();
		} else {
			widget.destroy();
			widget = null;
		}
	});

	simplePrefs.on('useRegExp', function () {
		properties.domainList.regexp = prefs.useRegExp;
	});
	// emulate radio buttons for whitelist/blacklist selection
	simplePrefs.on('useWhitelist', function () {
		prefs.useBlacklist = !prefs.useWhitelist;

		if (prefs.useWhitelist) {
			properties.domainList.type = 'white';
			properties.domainList.domains = prefs.whitelist.split(' ');
		} else {
			properties.domainList.type = 'black';
			properties.domainList.domains = prefs.blacklist.split(' ');
		}
	});
	simplePrefs.on('useBlacklist', function () {
		prefs.useWhitelist = !prefs.useBlacklist;

		if (prefs.useBlacklist) {
			properties.domainList.type = 'black';
			properties.domainList.domains = prefs.blacklist.split(' ');
		} else {
			properties.domainList.type = 'white';
			properties.domainList.domains = prefs.whitelist.split(' ');
		}
	});
	// manage domains list edition
	simplePrefs.on('whitelist', function () {
		if (properties.domainList.type == 'white') {
			properties.domainList.domains = prefs.whitelist.split(' ');
		}
	});
	simplePrefs.on('blacklist', function () {
		if (properties.domainList.type == 'black') {
			properties.domainList.domains = prefs.blacklist.split(' ');
		}
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
		properties.raw.support.email = prefs.supportEmail;
	});
	simplePrefs.on('supportAbout', function () {
		properties.raw.support.about = prefs.supportAbout;
	});
	simplePrefs.on('supportStandardURLs', function () {
		properties.raw.support.standard = prefs.supportStandardURLs;
	});

	simplePrefs.on('supportCustomRulesBefore', function () {
		properties.customRules.support.before = prefs.supportCustomRulesBefore;
	});
	simplePrefs.on('supportCustomRulesAfter', function () {
		properties.customRules.support.after = prefs.supportCustomRulesAfter;
	});
	simplePrefs.on('customRules', function () {
		properties.raw.customRules.rules = prefs.customRules;
	});

	simplePrefs.on('protocols', function () {
		properties.raw.protocols = prefs.protocols;
	});
	simplePrefs.on('subdomains', function () {
		properties.raw.subdomains = prefs.subdomains;
	});
	simplePrefs.on('excludedElements', function () {
		properties.raw.excludedElements = prefs.excludedElements;
	});

    simplePrefs.on('advancedSettings', function () {
		let parameters = {ui: {}, support: {}, customRules: {support: {}}, configuration: {defaults: {}} };
		parameters.ui = properties.ui;

		parameters.support.email = properties.raw.support.email;
		parameters.support.about = properties.raw.support.about;
		parameters.support.standard = properties.raw.support.standard;

		parameters.customRules.support.before = properties.customRules.support.before
		parameters.customRules.support.after = properties.customRules.support.after
		parameters.customRules.rules = properties.raw.customRules.rules;

		parameters.configuration.protocols = properties.raw.protocols;
		parameters.configuration.subdomains = properties.raw.subdomains;
		parameters.configuration.excludedElements = properties.raw.excludedElements;

		parameters.configuration.defaults.protocols = properties.raw.defaults.protocols;
		parameters.configuration.defaults.subdomains = properties.raw.defaults.subdomains;
		parameters.configuration.defaults.excludedElements = properties.raw.defaults.excludedElements;
		
		require('ui').Popup().display ("linkificator:advanced-settings",
									   "chrome://linkificator/content/advanced-options.xul",
									   parameters);
		
		if (parameters.changed !== undefined) {
			if (parameters.changed.support !== undefined) {
				let support = parameters.changed.support;
				if (support.email !== undefined) {
					prefs.supportEmail = support.email;
				}
				if (support.about !== undefined) {
					prefs.supportAbout = support.about;
				}
				if (support.standard !== undefined) {
					prefs.supportStandardURLs = support.standard;
				}
			}

			if (parameters.changed.customRules !== undefined) {
				let customRules = parameters.changed.customRules;
				if (customRules.support !== undefined) {
					if (customRules.support.before !== undefined) {
						prefs.supportCustomRulesBefore = customRules.support.before;
					}
					if (customRules.support.after !== undefined) {
						prefs.supportCustomRulesAfter = customRules.support.after;
					}
				}
				if (customRules.rules !== undefined) {
					prefs.customRules = customRules.rules;
				}
			}

			if (parameters.changed.configuration !== undefined) {
				let configuration = parameters.changed.configuration;
				if (configuration.protocols !== undefined) {
					prefs.protocols = configuration.protocols;
				}
				if (configuration.subdomains !== undefined) {
					prefs.subdomains = configuration.subdomains;
				}
				if (configuration.excludedElements !== undefined) {
					prefs.excludedElements = configuration.excludedElements;
				}
			}
		}
	});

    function toggle () {
		prefs.activated = !prefs.activated;
        return prefs.activated;
    }
    function setIcon (view, icon) {
		if (view === undefined) {
			if (!widget) return;

			let tab = tabs.activeTab;
			let view = widget.getView(tab.window);
			if (!view) return;

			view.contentURL = prefs.activated ? (configurator.linkifyURL(tab.url) ? link_on : link_excluded) : link_off;
		} else {
			view.contentURL = prefs.activated ? icon : link_off;
		}
    }
    
    return {
        isActive: function () {
            return prefs.activated;
        },
        
        setState: function (tab, data) {
			if (!widget) return;

			if (tab !== tabs.activeTab) return;

            let view = widget.getView(tab.window);
            if (!view) return;

			if (data.links == -1) {
				view.tooltip = _("stats.excluded");
				setIcon (view, link_excluded);
			} else {
				if (data.links == 0 && data.time == 0) {
					view.tooltip = _("stats.not_processed");
				} else {
					view.tooltip = _("stats.links", parseInt(data.links)) + " " + _("stats.time", parseInt(data.time));
				}
				setIcon (view, link_on);
			}
        }
    };
}

exports.Controler = Controler;
