
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// controler.js - Linkificator's module
// author: MarkaPola


//
// Manage UI controling linkificator behavior
//


function Controler (configurator) {
	// request various needed modules
	var widgets = require('sdk/widget');
	var tabs = require('sdk/tabs');
	var simplePrefs = require('sdk/simple-prefs');
	var hotKeys = require('sdk/hotkeys');

	var _ = require('sdk/l10n').get;

	var data = require('sdk/self').data;

	var properties = configurator.properties;
	// add section to keep ui settings during session
	properties.ui = {};

    var prefs = simplePrefs.prefs;
    
	function createHotKey (combo) {
		return hotKeys.Hotkey({
		combo: combo,
		onPress: function () {
			toggle();
		}
		});
	}

	function Widget () {
		this._actions = {};

		this._widget = widgets.Widget({
			id: "linkificator@markapola",
			label: "Linkificator",
       
			contentURL: data.url("widget/widget.html"),
			contentScriptFile: data.url("widget/widget.js"),

			onMouseover: (function () {
				if (this._actions.mouseover) {
					this._actions.mouseover();
				}
			}).bind(this)
		});
	};
	Widget.prototype = {
		set content (image) {
			this._widget.port.emit(image);
		},

		on: function (event, action) {
			if (event === 'mouseover') {
				this._actions.mouseover = action;
			} else if (event === 'right-click') {
				this._widget.port.on('right-click', action);
			}
		},

		destroy: function () {
			this._widget.destroy();
		},

		setStatus: function (tab) {
			if (tab !== tabs.activeTab) return;

			let view = this._widget.getView(tab.window);
			if (!view) return;

			function setImage (image) {
				view.port.emit(image);
			}

			if (isActive() && isValidDocument(tab)) {
				if (configurator.linkifyURL(tab.url)) {
					view.tooltip = _("stats.links", 0) + " " + _("stats.time", 0);
					setImage('on');
				} else {
					view.tooltip = _("stats.excluded");
					setImage('excluded');
				}
			} else {
				view.tooltip = _("stats.not_processed");
				setImage(isActive() ? 'on' : 'off');
			}
		},
		setStatistics: function (tab, stats) {
			if (tab !== tabs.activeTab) return;

            let view = this._widget.getView(tab.window);
            if (!view) return;

			view.tooltip = _("stats.links", parseInt(stats.links)) + " " + _("stats.time", parseInt(stats.time));
		}
	};
	function createWidget () {
		var widget = new Widget();

		// set correct image
		widget.content = prefs.activated ? 'on' : 'off';
		// bind right click to enable/disable toggle
		widget.on('right-click', toggle);
		// bind mouseover to retrieve statistics
		widget.on('mouseover', function () {
			if (actions.statistics) {
				actions.statistics();
			}
		});

		return widget;
	}

	// initialize environment from preferences
	var hotkey = createHotKey(prefs.hotkey);
	var widget = prefs.displayWidget ? createWidget() : null;

	// handle events for various preferences changes
	simplePrefs.on('activated', function () {
		widget.setStatus(tabs.activeTab);

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


	// misc. functions
    function toggle () {
		prefs.activated = !prefs.activated;
        return prefs.activated;
    }
    function isActive () {
        return prefs.activated;
    }
	function isValidDocument (tab) {
		let contentType = tab.contentType;
		return contentType == 'text/html' || contentType == 'text/plain';
	}

	// actions registering
	var actions = {};

	function register (tag, action) {
		switch (tag) {
		case 'activate':
			actions.activate = action;
			return true;
			break;
		case 'statistics':
			actions.statistics = action;
			return true;
			break;
		default:
			return false;
		}
	}

    return {
		isValidDocument: function (tab) {
			return isValidDocument(tab);
		},
        isActive: function () {
            return isActive();
        },
        
        setStatus: function (tab) {
			if (widget) {
				widget.setStatus(tab);
			}
        },
		setStatistics: function (tab, stats) {
			if (widget) {
				widget.setStatistics(tab, stats);
			}
		},

		on: function (tag, action) {
			register(tag, action);
		}
    };
}

exports.Controler = Controler;
