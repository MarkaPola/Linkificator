
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
	var panels = require('sdk/panel');
	var tabs = require('sdk/tabs');
	var simplePrefs = require('sdk/simple-prefs');
	var hotKeys = require('sdk/hotkeys');

	var window_utils = require('sdk/window/utils');

	var _ = require('sdk/l10n').get;

	var data = require('sdk/self').data;

	var properties = configurator.properties;
	// add section to keep ui settings during session
	properties.ui = {};

    var prefs = simplePrefs.prefs;
    
	var excludedURLs = (function () {
		var urls = new Array();

		return {
			add: function (url) {
				if (urls.indexOf(url) == -1) {
					urls.push(url);
					return true;
				}
				return false;
			},
			remove: function (url) {
				let index = urls.indexOf(url);
				if (index != -1) {
					urls.splice(index, 1);
					return true;
				}
				return false;
			},
			toggle: function (url) {
				let index = urls.indexOf(url);
				if (index == -1) {
					urls.push(url);
					return null;
				} else {
					urls.splice(index, 1);
					return url;
				}
			},

			isExcluded: function (url) {
				return urls.indexOf(url) != -1;
			}
		};
	})();

	var status = (function () {
		var listeners = {update: [], stats: []};

		var state = isActive() ? 'processed' : 'not_processed';
		var icon = isActive() ? 'on' : 'off';
		var tooltip = isActive() ? _("stats.links", 0) + " " + _("stats.time", 0) : _("stats.not_processed");

		return {
			update: function (tab, stats) {
				if (tab !== tabs.activeTab) return;

				if (stats === undefined) {
					if (isActive() && isValidDocument(tab)) {
						if (excludedURLs.isExcluded(tab.url)) {
							state = 'excluded';
							icon = 'excluded';
							tooltip = _("stats.excluded");
						} else if (configurator.linkifyURL(tab.url)) {
							state = 'processed';
							icon = 'on';
							tooltip = _("stats.links", 0) + " " + _("stats.time", 0);
						} else {
							state = 'filtered';
							icon = 'excluded';
							tooltip = _("stats.filtered");
						}
					} else {
						icon = isActive() ? 'on' : 'off';
						state = 'not_processed';
						tooltip = _("stats.not_processed");
					}

					listeners.update.forEach(function (observer) {
						observer(tab, this);
					}, this);
				} else {
					tooltip =  _("stats.links", parseInt(stats.links)) + " " + _("stats.time", parseInt(stats.time));

					listeners.stats.forEach(function (observer) {
						observer(tab, this);
					}, this);
				}
			},

			get state () {
				return state;
			},
			get icon () {
				return icon;
			},
			get tooltip () {
				return tooltip;
			},

			// callbacks will be called each time status or tooltip is changed
			on: function (action, callback) {
				let array;

				if (action === 'update') {
					array = listeners.update;
				} else if (action === 'statistics') {
					array = listeners.stats;
				}
				if (array !== undefined) {
					if (array.indexOf(callback) == -1)
						array.push(callback);
				}
			},
			removeListener: function (action, callback) {
				let array;

				if (action === 'update') {
					array = listeners.update;
				} else if (action === 'statistics') {
					array = listeners.stats;
				}
				if (array !== undefined) {
					let index = array.indexOf(callback);
					if (index != -1)
					array.splice(index, 1);
				}
			}
		}
	})();

	var hotKeyManager = (function () {
		function HotKeyHandler (name, action) {
			function createHotKey (combo, action) {
				try {
					return hotKeys.Hotkey({
						combo: combo,
						onPress: action
					});
				} catch (e) {
					// possibility to raise exception INVALID_COMBINATION
					return null;
				}
			}

			// initialize
			var hotKey = createHotKey(prefs[name], action);
			
			// track changes
			simplePrefs.on(name, function () {
				if (hotKey != null) {
					hotKey.destroy();
				}
				hotKey = createHotKey(prefs[name], action);
			});

			return {
				update: function (action) {
					destroy();
					hotKey = createHotKey(prefs[name], action);
				},
				destroy: function () {
					if (hotKey != null) {
						hotKey.destroy();
					}
				}
			}
		}

		var initialSetting = true;
		var keys = {};

		// track changes on hot key "editor"
		simplePrefs.on('hotkeyName', function () {
			initialSetting = true;
			prefs.hotkeyValue = prefs[prefs.hotkeyName];
			initialSetting = false;
		});
		simplePrefs.on('hotkeyValue', function () {
			if (! initialSetting) {
				prefs[prefs.hotkeyName] = prefs.hotkeyValue;
			}
		});

		return {
			add: function (name, action) {
				if (keys[name] === undefined) {
					keys[name] = HotKeyHandler(name, action);
					return true;
				} else {
					return false;
				}
			},
			update: function (name, action) {
				if (keys[name] !== undefined) {
					keys[name].update(action);
					return true;
				} else {
					return false;
				}
			},				
			remove: function (name) {
				if (keys[name] !== undefined) {
					keys[name].destroy();
					keys[name] = undefined;
					return true;
				} else {
					return false;
				}
			}
		}
	})();
				
	var widgetActions = {
		none: null,
		toggle: toggle,
		manage: manage,
		linkify: reparse
	};

	function Widget () {
		var self = this;

		this._actions = {mouseover: null,
						 middle_click: null,
						 right_click: null
						};

		this._widget = widgets.Widget({
			id: "linkificator@markapola",
			label: "Linkificator",
       
			contentURL: data.url("widget/widget.html"),
			contentScriptFile: data.url("widget/widget.js"),

			panel: panels.Panel({
				contentURL: data.url("panel/panel.html"),
				contentScriptFile: data.url("panel/panel.js"),
				
				width: 140,
				height: 165
			}),

			onMouseover: (function () {
				if (this._actions.mouseover) {
					this._actions.mouseover();
				}
			}).bind(this)
		});

		this._widget.port.on("middle-click", (function () {
				if (this._actions.middle_click) {
					this._actions.middle_click();
				}
			}).bind(this));
		this._widget.port.on("right-click", (function () {
				if (this._actions.right_click) {
					this._actions.right_click();
				}
			}).bind(this));

		this._widget.panel.port.emit('initialize', {options: _("panel.options"),
													enable: _("panel.enable"),
													disable: _("panel.disable"),
													include: _("panel.include"),
													exclude: _("panel.exclude"),
													linkify: _("panel.linkify")});
		this._widget.panel.on('show', function () {
			this.port.emit('configure', {active: isActive(), status: status.state});
		});

		this._widget.port.emit(status.state);
		this._widget.tooltip = status.tooltip;
		this._widget.panel.port.emit(status.state);

		this._panel = {
			on: function (event, action) {
				function execute (action) {
					self._widget.panel.hide();
					action();
				}

				if (event === 'options') {
					self._widget.panel.port.on('options', function () {
						execute(action);
					});
				} else if (event === 'toggle') {
					self._widget.panel.port.on('toggle', function () {
						execute(action);
					});
				} else if (event === 're-parse') {
					self._widget.panel.port.on('re-parse', function () {
						execute(action);
					});
				} else if (event === 'manage') {
					self._widget.panel.port.on('manage', function () {
						execute(action);
					});
				}
			}
		};

		this._update = function (tab, status) {
			if (tab !== tabs.activeTab) return;
			
			let view = self._widget.getView(tab.window);
			if (!view) return;
			
			// set icon
			view.port.emit(status.icon);
			// set tooltip
			view.tooltip = status.tooltip;
		};
		status.on('update', this._update);

		this._statistics = function (tab, status) {
			if (tab !== tabs.activeTab) return;
			
			let view = self._widget.getView(tab.window);
			if (!view) return;
			
			// set tooltip
			view.tooltip = status.tooltip;
		};
		status.on('statistics', this._statistics);
	}
	Widget.prototype = {
		get panel () {
			return this._panel;
		},

		on: function (event, action) {
			if (event === 'mouseover') {
				this._actions.mouseover = action;
			} else if (event === 'middle-click') {
				this._actions.middle_click = action;
			} else if (event === 'right-click') {
				this._actions.right_click = action;
			}
		},

		destroy: function () {
			status.removeListener('update', this._update);
			status.removeListener('statistics', this._statistics);
			this._widget.destroy();
		}
	};
	function createWidget () {
		var widget = new Widget();

		// bind right click to specified action
		widget.on('right-click', widgetActions[prefs.widgetRightClick]);
		// bind mouseover to retrieve statistics
		widget.on('mouseover', function () {
			if (actions.statistics) {
				actions.statistics();
			}
		});

		let panel = widget.panel;
		panel.on('options', function () {
			window_utils.getMostRecentBrowserWindow().BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent('linkificator@markapola') + "/preferences");
		});
		panel.on('toggle', toggle);
		panel.on('re-parse', reparse);
		panel.on('manage', manage);

		return widget;
	}

	// initialize environment from preferences
	hotKeyManager.add('hotkeyToggle', toggle);
	hotKeyManager.add('hotkeyManage', manage);
	hotKeyManager.add('hotkeyParse', reparse);
	var widget = prefs.displayWidget ? createWidget() : null;

	// handle events for various preferences changes
	simplePrefs.on('activated', function () {
		let tab = tabs.activeTab;

		status.update(tab);

		// handling of registered actions
		if (prefs.activated && actions.activate
			&& isValidDocument(tab) && configurator.linkifyURL(tab.url)) {
			actions.activate(tab);
		}
	});

	simplePrefs.on('widgetRightClick', function () {
		widget.on('right-click', widgetActions[prefs.widgetRightClick]);
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

		require('./ui').Popup().display ("linkificator:advanced-settings",
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

	function reparse () {
		let tab = tabs.activeTab;

		if (actions.reparse
			&& isActive() && isValidDocument(tab) && configurator.linkifyURL(tab.url)) {
			actions.reparse(tab);
		}
	}

	function manage () {
		let tab = tabs.activeTab;

		if (isActive() && isValidDocument(tab) && configurator.linkifyURL(tab.url)) {
			let url = excludedURLs.toggle(tab.url);
			status.update(tab);
			
			if (url) {
				actions.activate && actions.activate(tab);
			} else {
				actions.undo && actions.undo(tab);
			}
		}
	}

	// actions registering
	var actions = {activate: null, reparse: null, undo: null, statistics: null};

	function register (tag, action) {
		switch (tag) {
		case 'activate':
			actions.activate = action;
			return true;
			break;
		case 're-parse':
			actions.reparse = action;
			return true;
			break;
		case 'undo':
			actions.undo = action;
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
        
		linkifyURL: function (url) {
			return !excludedURLs.isExcluded(url) && configurator.linkifyURL(url);
		},

        setStatus: function (tab) {
			status.update(tab);
        },
		setStatistics: function (tab, stats) {
			status.update(tab, stats);
		},

		on: function (tag, action) {
			register(tag, action);
		}
    };
}

exports.Controler = Controler;
