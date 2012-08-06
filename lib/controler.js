
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
	var preferencesService = require ('api-utils/preferences-service');
	var simplePrefs = require('simple-prefs');
	var widgets = require('widget');
	var tabs = require('tabs');
	var hotKeys = require('hotkeys');

	var _ = require('l10n').get;


	var properties = configurator.properties;

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

	properties.raw.protocols = prefs.protocols;
	properties.raw.subdomains = prefs.subdomains;
	properties.raw.excludedElements = prefs.excludedElements;

	// handle events for various preferences changes
	const SYNC_PROPERTIES = ["services.sync.prefs.sync.extensions.linkificator@markapola.hotkey",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.displayWidget",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.useRegExp",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.useWhitelist",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.whitelist",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.useBlacklist",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.blacklist",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.overrideTextColor",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.linkColor",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.overrideBackgroundColor",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.backgroundColor",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.protocols",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.subdomains",
							 "services.sync.prefs.sync.extensions.linkificator@markapola.excludedElements"];

	simplePrefs.on('sync', function () {
		let state = prefs.sync;
		SYNC_PROPERTIES.forEach (function (element, index, array) {
			preferencesService.set(element, state);
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
			properties.domainList.domains = prefs.whiteList.split(' ');
		} else {
			properties.domainList.type = 'black';
			properties.domainList.domains = prefs.blackList.split(' ');
		}
	});
	simplePrefs.on('useBlacklist', function () {
		prefs.useWhitelist = !prefs.useBlacklist;

		if (prefs.useBlacklist) {
			properties.domainList.type = 'black';
			properties.domainList.domains = prefs.blackList.split(' ');
		} else {
			properties.domainList.type = 'white';
			properties.domainList.domains = prefs.whiteList.split(' ');
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
		let parameters = {};
		parameters.protocols = properties.raw.all.current.protocols;
		parameters.subdomains = properties.raw.all.current.subdomains;
		parameters.excludedElements = properties.raw.all.current.excludedElements;
		parameters.defaults = {};
		parameters.defaults.protocols = properties.raw.all.defaults.protocols;
		parameters.defaults.subdomains = properties.raw.all.defaults.subdomains;
		parameters.defaults.excludedElements = properties.raw.all.defaults.excludedElements;
		
		require('ui').Popup().display ("linkificator:advanced-settings",
									   "chrome://linkificator/content/advanced-options.xul",
									   parameters);
		
		if (parameters.changed) {
			if (parameters.changed.protocols) {
				prefs.protocols = parameters.changed.protocols;
			} else if (parameters.changed.subdomains) {
				prefs.subdomains = parameters.changed.subdomains;
			} else if (parameters.changed.excludedElements) {
				prefs.excludedElements = parameters.changed.excludedElements;
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
