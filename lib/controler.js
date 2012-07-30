
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// controler.js - Linkificator's module
// author: MarkaPola


//
// Manage UI controling linkificator behavior
//

//const {Cu} = require("chrome");
require("chrome");
const Cu = Components.utils;
Cu.import("resource://gre/modules/Services.jsm");

var widgets = require('widget');
var tabs = require('tabs');
var simplePrefs = require('simple-prefs');
var hotKeys = require('hotkeys');
var _ = require('l10n').get;


function Controler (data, configurator) {
	var properties = configurator.properties;

    var link_off = data.url("widget/link-off.png");
    var link_on = data.url("widget/link-on.png");
    var link_excluded = data.url("widget/link-excluded.png");
        
    var prefs = simplePrefs.prefs;
        
    var widget = widgets.Widget({
        id: "linkificator@makapola.dev",
        label: "Linkificator",
       
        contentURL: prefs.activated ? link_on : link_off,

		onClick: toggle
    });
    
	function createHotKey (combo) {
		return hotKeys.Hotkey({
		combo: combo,
		onPress: function () {
			toggle();
		}
		});
	}

	// initialize environment and properties from preferences
	var hotkey = createHotKey(prefs.hotkey);

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
	simplePrefs.on('activated', function() {
		setIcon();
	});
	simplePrefs.on('hotkey', function() {
		hotkey.destroy();
		hotkey = createHotKey(prefs.hotkey);
	});

	simplePrefs.on('useRegExp', function() {
		properties.domainList.regexp = prefs.useRegExp;
	});
	// emulate radio buttons for whitelist/blacklist selection
	simplePrefs.on('useWhitelist', function() {
		prefs.useBlacklist = !prefs.useWhitelist;

		if (prefs.useWhitelist) {
			properties.domainList.type = 'white';
			properties.domainList.domains = prefs.whiteList.split(' ');
		} else {
			properties.domainList.type = 'black';
			properties.domainList.domains = prefs.blackList.split(' ');
		}
	});
	simplePrefs.on('useBlacklist', function() {
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
	simplePrefs.on('whitelist', function() {
		if (properties.domainList.type == 'white') {
			properties.domainList.domains = prefs.whitelist.split(' ');
		}
	});
	simplePrefs.on('blacklist', function() {
		if (properties.domainList.type == 'black') {
			properties.domainList.domains = prefs.blacklist.split(' ');
		}
	});
	// management of colors
	simplePrefs.on('overrideTextColor', function() {
		properties.style.text.override = prefs.overrideTextColor;
	});
	simplePrefs.on ('linkColor', function() {
		properties.style.text.color = prefs.linkColor;
	});
	simplePrefs.on('overrideBackgroundColor', function() {
		properties.style.background.override = prefs.overrideBackgroundColor;
	});
	simplePrefs.on('backgroundColor', function() {
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

    simplePrefs.on('advancedSettings', function() {
		let settingsWindow = Services.wm.getMostRecentWindow("linkificator:advanced-settings");
		if (settingsWindow) {
			settingsWindow.focus();
		} else {
			let parameters = properties.raw.all.current;
			parameters.defaults = properties.raw.all.defaults;
			parameters.wrappedJSObject = parameters;

			Services.ww.openWindow(null, "chrome://linkificator/content/advanced-options.xul", "_blank", "chrome,centerscreen,dialog=yes,modal=yes,titlebar=yes", parameters);

			if (parameters.changed) {
				if (parameters.changed.protocols) {
					prefs.protocols = parameters.changed.protocols;
				} else if (parameters.changed.subdomains) {
					prefs.subdomains = parameters.changed.subdomains;
				} else if (parameters.changed.excludedElements) {
					prefs.excludedElements = parameters.changed.excludedElements;
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
