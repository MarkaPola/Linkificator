
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// controler.js - Linkificator's module
// author: MarkaPola


//
// Manage UI controling linkificator behavior
//


function Controler (configurator) {
    "use strict";
    
	// request various needed modules
	var widgets = require('sdk/widget');
	var panels = require('sdk/panel');
	var tabs = require('sdk/tabs');
	var simplePrefs = require('sdk/simple-prefs');
	var hotKeys = require('sdk/hotkeys');
	var contextMenu = require("sdk/context-menu");

    var windows = require("sdk/windows");
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
        function getDefault () {
            return {
                state: isActive() ? 'processed' : 'not_processed', 
                icon: isActive() ? 'on' : 'off', 
                tooltip: isActive() ? _("stats.links", 0) + " " + _("stats.time", 0) : _("stats.not_processed")
            };
        }
        function getCurrent (tab) {
            var current = getDefault();
            
			if (isActive() && isValidDocument(tab)) {
				if (excludedURLs.isExcluded(tab.url)) {
					current.state = 'excluded';
					current.icon = 'excluded';
					current.tooltip = _("stats.excluded");
				} else if (configurator.linkifyURL(tab.url)) {
					current.state = 'processed';
					current.icon = 'on';
					current.tooltip = _("stats.links", 0) + " " + _("stats.time", 0);
				} else {
					current.state = 'filtered';
					current.icon = 'excluded';
					current.tooltip = _("stats.filtered");
				}
			} else {
				current.icon = isActive() ? 'on' : 'off';
				current.state = 'not_processed';
				current.tooltip = _("stats.not_processed");
			}

            return current;
        }
        
		var listeners = {update: [], stats: []};

        return {
            get initial () {
                return getDefault();
            },
            get current () {
                return getCurrent(tabs.activeTab);
            },
            
            update: function (tab, stats) {
                if (tab === undefined) {
                    // update all windows
                    for each (var window in windows.browserWindows) {
                        let tab = window.tabs.activeTab;
                        let current = getCurrent(tab);

                        listeners.update.forEach(function (observer) {
						    observer(tab, current);
					    }, this);
                    }
                } else {
                    if (tab !== tabs.activeTab) return;
                    
				    if (stats === undefined) {
                        let current = getCurrent(tab);

					    listeners.update.forEach(function (observer) {
						    observer(tab, current);
					    }, this);
				    } else {
					    let tooltip =  _("stats.links", parseInt(stats.links, 10)) + " " + _("stats.time", parseInt(stats.time, 10));

					    listeners.stats.forEach(function (observer) {
						observer(tab, tooltip);
					    }, this);
				    }
                }
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
		};
	})();

	var contextMenuManager = (function () {
        var item = null;

        return {
            activate: function () {
		        item = contextMenu.Item({
			        label: _("menu.linkify"),
			        image: data.url("resources/link-on.png"),
			        data: "re-parse",
			        contentScriptFile: data.url("menu/menu.js"),
                    
			        onMessage: function (data) {
				        reparse();
			        }
		        });
            },

            destroy: function () {
                if (contextMenu != null) {
                    item.destroy();
                    item = null;
                }
            }
        };
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

            function destroyHotKey (key) {
                if (key != null) {
					key.destroy();
				}
            }

            function updateHotKey (func) {
                if (func !== undefined) {
                    action = func;
                }
                destroyHotKey(hotKey);
                hotKey = createHotKey(prefs[name], action);
            }

			// initialize
			var hotKey = createHotKey(prefs[name], action);
			
			// track changes
			simplePrefs.on(name, function () {
                updateHotKey();
			});

			return {
				update: function (action) {
                    updateHotKey(action);
				},
				destroy: function () {
                    destroyHotKey();
				}
			};
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
		};
	})();
				
	var widgetActions = {
		none: null,
        show: show, 
		toggle: toggle,
		manage: manage,
		linkify: reparse
	};

    // Define a new Panel extending panels.Panel capabilities
    function Panel (options) {
        var wid = null;
        var basicShow = null;
        
        if (options.position instanceof widgets.Widget) {
            // Compute id of toolbar item
            wid = "widget:" + require("sdk/self").id + "-" + options.position.id;
            delete options.position;
        }
        
        let panel = panels.Panel(options);
        basicShow = panel.show.bind(panel);
        
        // override show method
        panel.show = (function (anchor) {
            if (anchor === undefined && !wid) {
                    basicShow();
                } else {
                    let id = anchor ? anchor : wid;
                    let node = window_utils.getMostRecentBrowserWindow().document.getElementById(id);
                    // display panel anchored to widget
                    if (basicShow.length === 2) {
                        basicShow(null, node);
                    } else {
                        basicShow(node);
                    }
                }
            }).bind(this);
        
        return panel;
    };
    // Specialization of Panel to handle context menu
    function Menu (options) {
        var _options = (function (list, options) {
            let opts = {};
            for each (let option in list) {
                opts[option] = options[option];
            delete options[option];
            }

            return opts;
        })(['items', 'events'], options);
        
        var _panel = Panel(options);
        if (_options.items) {
            _panel.port.emit('initialize', _options.items);
        }
        
        return {
		    get port () {
			    return _panel.port;
		    },

            show: function (anchor) {
                _panel.show(anchor);
            },
            hide: function () {
                _panel.hide();
            },
            
		 	on: function (event, action) {
                if (_options.events.indexOf(event) != -1) {
		 		    _panel.port.on(event, function () {
		 			    _panel.hide();
		 			    action();
		 		    });
                    return;
                }
                
                _panel.on(event, action);
		 	},

            destroy: function () {
                _panel.destroy();
            }
        };
    }
    // Define a new Widget extending widgets.Widget capabilities
	function Widget () {
		var self = this;
        
		this._actions = {mouseover: null,
						 left_click: null,
						 middle_click: null,
						 right_click: null
						};

		this._widget = widgets.Widget({
			id: "linkificator@markapola",
			label: "Linkificator",
       
			contentURL: data.url("widget/widget.html"),
			contentScriptFile: data.url("widget/widget.js"),

			onMouseover: (function () {
				if (this._actions.mouseover) {
					this._actions.mouseover();
				}
			}).bind(this), 
			onClick: (function () {
				if (this._actions.left_click) {
					this._actions.left_click();
				}
			}).bind(this)
		});

        this._menu = Menu({
			contentURL: data.url("panel/panel.html"),
			contentScriptFile: data.url("panel/panel.js"),

            position: this._widget,
			width: 140,
			height: 165,

            items: {options: _("panel.options"),
					enable: _("panel.enable"),
					disable: _("panel.disable"),
					include: _("panel.include"),
					exclude: _("panel.exclude"),
					linkify: _("panel.linkify")},
            events: ['options', 'toggle', 're-parse', 'manage']
		}),
            
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

		this._menu.on('show', function () {
			this.port.emit('configure', {active: isActive(), status: status.current.state});
		});

        let initial = status.initial;
		this._widget.port.emit(initial.state);
		this._widget.tooltip = initial.tooltip;
		this._menu.port.emit(initial.state);

		this._update = function (tab, status) {
			let view = self._widget.getView(tab.window);
			if (!view) return;
			
			// set icon
			view.port.emit(status.icon);
			// set tooltip
			view.tooltip = status.tooltip;
		};
		status.on('update', this._update);

		this._statistics = function (tab, stats) {
			if (tab !== tabs.activeTab) return;
			
			let view = self._widget.getView(tab.window);
			if (!view) return;
			
			// set tooltip
			view.tooltip = stats;
		};
		status.on('statistics', this._statistics);
	}
	Widget.prototype = {
		get menu () {
			return this._menu;
		},

		on: function (event, action) {
			if (event === 'mouseover') {
				this._actions.mouseover = action;
			} else if (event === 'left-click') {
				this._actions.left_click = action;
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
			this._menu.destroy();
		}
	};
	function createWidget () {
		var widget = new Widget();

		// bind left click to specified action
		widget.on('left-click', widgetActions[prefs.widgetLeftClick]);
		// bind middle click to specified action
		widget.on('middle-click', widgetActions[prefs.widgetMiddleClick]);
		// bind right click to specified action
		widget.on('right-click', widgetActions[prefs.widgetRightClick]);
		// bind mouseover to retrieve statistics
		widget.on('mouseover', function () {
			if (isActive() && actions.statistics) {
				actions.statistics();
			}
		});

		let menu = widget.menu;
        // bind actions for menu entries
		menu.on('options', function () {
			window_utils.getMostRecentBrowserWindow().BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent('linkificator@markapola') + "/preferences");
		});
		menu.on('toggle', toggle);
		menu.on('re-parse', reparse);
		menu.on('manage', manage);

		return widget;
	}

	// initialize environment from preferences
	var widget = prefs.displayWidget ? createWidget() : null;
    if (prefs.contextMenuIntegration) {
        contextMenuManager.activate();
    }
	hotKeyManager.add('hotkeyToggle', toggle);
	hotKeyManager.add('hotkeyManage', manage);
	hotKeyManager.add('hotkeyParse', reparse);

	// handle events for various preferences changes
	simplePrefs.on('activated', function () {
		status.update();

        for each (var window in windows.browserWindows) {
		    let tab = window.tabs.activeTab;
		    // handling of registered actions
		    if (isValidDocument(tab) && configurator.linkifyURL(tab.url)) {
                if (!excludedURLs.isExcluded(tab.url)) {
			        if (prefs.activated && actions.activate) {
				        actions.activate(tab);
			        } else if (!prefs.activated && actions.undo) {
				        actions.undo(tab);
			        }
                }
		    }
        }
	});

	simplePrefs.on('displayWidget', function () {
		if (prefs.displayWidget) {
			widget = createWidget();
		} else {
			widget.destroy();
			widget = null;
		}
	});

	simplePrefs.on('contextMenuIntegration', function () {
		if (prefs.contextMenuIntegration) {
			contextMenuManager.activate();
		} else {
			contextMenuManager.destroy();
		}
	});

	simplePrefs.on('widgetLeftClick', function () {
        if (widget != null) {
		    widget.on('left-click', widgetActions[prefs.widgetLeftClick]);
        }
	});
	simplePrefs.on('widgetMiddleClick', function () {
        if (widget != null) {
		    widget.on('middle-click', widgetActions[prefs.widgetMiddleClick]);
        }
	});
	simplePrefs.on('widgetRightClick', function () {
        if (widget != null) {
		    widget.on('right-click', widgetActions[prefs.widgetRightClick]);
        }
	});

	// manage advanced settings
    simplePrefs.on('advancedSettings', function () {
		let parameters = {ui: properties.ui};

		require('./ui/popup').display ("linkificator:advanced-settings",
									   "chrome://linkificator/content/advanced-options.xul",
									   parameters);
	});


	// misc. functions
    function show () {
        widget.menu.show();
    }
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
