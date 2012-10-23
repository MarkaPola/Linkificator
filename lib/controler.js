
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

	// initialize environment from preferences
	var hotkey = createHotKey(prefs.hotkey);
	var widget = prefs.displayWidget ? createWidget() : null;

	// handle events for various preferences changes
	simplePrefs.on('activated', function () {
		setIcon();

		// handling of registered actions
		if (prefs.activated && actions.activate) {
			actions.activate();
		}
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

	// manage advanced settings
    simplePrefs.on('advancedSettings', function () {
		let parameters = {ui: properties.ui};

		require('ui').Popup().display ("linkificator:advanced-settings",
									   "chrome://linkificator/content/advanced-options.xul",
									   parameters);
	});


	// Widget handling
	function isValidDocument (tab) {
		let contentType = tab.contentType;
		return contentType == 'text/html' || contentType == 'text/plain';
	}
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

			view.contentURL = prefs.activated ? (isValidDocument(tab) ? (configurator.linkifyURL(tab.url) ? link_on : link_excluded) : link_on) : link_off;
		} else {
			view.contentURL = prefs.activated ? icon : link_off;
		}
    }
    
	// actions registering
	var actions = {};

	function register (tag, action) {
		switch (tag) {
		case 'activate':
			actions.activate = action;
			return true;
			break;
		default:
			return false;
		}
	}

    return {
		get pageExcluded () {
			return {links: -1, time: 0};
		},
		get pageNotProcessed () {
			return {links: -2, time: 0};
		},

		hasValidDocument: function (tab) {
			return isValidDocument(tab);
		},

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
			} else if (data.links == -2) {
				view.tooltip = _("stats.not_processed");
				setIcon (view, link_on);
			} else {
				view.tooltip = _("stats.links", parseInt(data.links)) + " " + _("stats.time", parseInt(data.time));
				setIcon (view, link_on);
			}
        },

		on: function (tag, action) {
			register(tag, action);
		}
    };
}

exports.Controler = Controler;
