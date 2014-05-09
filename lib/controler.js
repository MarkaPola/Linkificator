
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
    const system = require('sdk/system');
	const tabs = require('sdk/tabs');
	const simplePrefs = require('sdk/simple-prefs');
    const prefs = simplePrefs.prefs;
	const hotKeys = require('sdk/hotkeys');
	const contextMenu = require("sdk/context-menu");

    const windows = require("sdk/windows");
	const window_utils = require('sdk/window/utils');

	const _ = require('sdk/l10n').get;

	const data = require('sdk/self').data;

    const menus = require('./ui/menu');
    const widgets = require('./ui/widget');

    
	var properties = configurator.properties;
	// add section to keep ui settings during session
	properties.ui = {};
    
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
            // return true if url is excluded, false otherwise
			toggle: function (url) {
				let index = urls.indexOf(url);
				if (index == -1) {
					urls.push(url);
					return true;
				} else {
					urls.splice(index, 1);
					return false;
				}
			},

			isExcluded: function (url) {
				return urls.indexOf(url) != -1;
			}
		};
	})();

    var includedURLs = (function () {
        var urls = new Map();

		return {
			add: function (tab) {
                urls.set(tab, tab.url);
			},
			remove: function (tab) {
                urls.delete(tab);
			},
            update: function (tab) {
                let url = urls.get(tab);
                if (url && (tab.url !== url)) {
                    urls.delete(tab);
                }
            },
            
            // return true if url is included, false otherwise
			toggle: function (tab) {
                if (urls.has(tab)) {
                    urls.delete(tab);
                    return false;
                } else {
                    urls.set(tab, tab.url);
                    return true;
                }
			},

			isIncluded: function (tab) {
                let url = urls.get(tab);

                return url && (tab.url === url);
			}
		};
	})();
        
    var status = (function () {
        function getDefault () {
            return {
                state: isActive() ? 'processed' : 'not_processed', 
                icon: isActive() ? 'linkificator-on' : 'linkificator-off', 
                tooltip: isActive() ? _("stats.links", 0) + " " + _("stats.time", 0) : _("stats.not_processed")
            };
        }
        function getCurrent (tab) {
            var current = getDefault();
            
			if (isActive() && isValidDocument(tab)) {
				if (excludedURLs.isExcluded(tab.url)) {
					current.state = 'excluded';
					current.icon = 'linkificator-excluded';
					current.tooltip = _("stats.excluded");
				} else if (linkifyURL(tab)) {
					current.state = 'processed';
					current.icon = 'linkificator-on';
					current.tooltip = _("stats.links", 0) + " " + _("stats.time", 0);
				} else {
					current.state = 'filtered';
					current.icon = 'linkificator-excluded';
					current.tooltip = _("stats.filtered");
				}
			} else {
				current.icon = isActive() ? 'linkificator-on' : 'linkificator-off';
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
                    if (!isActiveTab(tab)) return;
                    
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
		toggle: toggle,
		manage: manage,
		linkify: reparse
	};

    // High level widget
    function Widget () {
		var self = this;

        this.locale = {
            options: _("panel.options"),
			enable: _("panel.enable"),
			disable: _("panel.disable"),
			include: _("panel.include"),
			exclude: _("panel.exclude"),
			linkify: _("panel.linkify")};
        
        this.menu = menus.Menu({
            id: 'menu-linkificator-markapola',

            entries: {
                options: {
                    label: this.locale.options, 
                    command: function () {
			            window_utils.getMostRecentBrowserWindow().BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent('linkificator@markapola') + "/preferences");
                    }
                },
                toggle: {
                    label: this.locale.disable,
                    command: function () {
                        toggle();
                    }
                }, 
                manage: {
                    label: this.locale.exclude,
                    command: function () {
                        manage();
                    }
                },
                linkify: {
                    label: this.locale.linkify,
                    command: function () {
                        reparse();
                    }
                }
            },
		    contentURL: data.url("panel/panel.html"),
		    contentScriptFile: data.url("panel/panel.js"),

            content: ['panelview', {flex: '1'},
                      ['label', {'class': 'panel-subview-header', value: 'Linkificator'}], 
                      ['toolbarbutton', {key: 'options',
                                         'class': 'subviewbutton cui-withicon', 
                                         id: 'linkificator-options',
                                         tabindex: '0',
                                         label: this.locale.options,
                                         image: data.url("resources/extension.png"), 
                                         command: function (event) {
                                             let PanelUI = event.target.ownerDocument.defaultView.PanelUI;
                                             PanelUI.hide();
                                             window_utils.getMostRecentBrowserWindow().BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent('linkificator@markapola') + "/preferences");
                                         }}],
                      ['menuseparator', {}],
                      ['toolbarbutton', {key: 'toggle',
                                         'class': 'subviewbutton cui-withicon',
                                         id: 'linkificator-toggle',
                                         tabindex: '0',
                                         label: this.locale.disable,
                                         image: data.url("resources/link-off.png"),
                                         shortcut: prefs.hotkeyToggle, 
                                         command: function (event) {
                                             let PanelUI = event.target.ownerDocument.defaultView.PanelUI;
                                             PanelUI.hide();
                                             toggle();
                                         }}],
                      ['toolbarbutton', {key: 'manage',
                                         'class': 'subviewbutton cui-withicon',
                                         id: 'linkificator-manage',
                                         tabindex: '0',
                                         label: this.locale.exclude,
                                         image: data.url("resources/link-exclude.png"),
                                         shortcut: prefs.hotkeyManage, 
                                         command: function (event) {
                                             let PanelUI = event.target.ownerDocument.defaultView.PanelUI;
                                             PanelUI.hide();
                                             manage();
                                         }}],
                      ['toolbarbutton', {key: 'linkify',
                                         'class': 'subviewbutton cui-withicon', 
                                         id: 'linkificator-linkify',
                                         tabindex: '0',
                                         label: this.locale.linkify,
                                         image: data.url("resources/link-update.png"),
                                         shortcut: prefs.hotkeyParse, 
                                         command: function (event) {
                                             let PanelUI = event.target.ownerDocument.defaultView.PanelUI;
                                             PanelUI.hide();
                                             reparse();
                                         }}]],

		    width: 140,
		    height: 165,
            
            onShow: (function (menu) {
                let active = isActive();
                let state = status.current.state;

                menu.toggle.shortcut = prefs.hotkeyToggle;
                menu.manage.shortcut = prefs.hotkeyManage;
                menu.linkify.shortcut = prefs.hotkeyParse;
                
                if (active) {
                    menu.toggle.label = this.locale.disable;
                    menu.toggle.image = data.url("resources/link-off.png");
                } else {
                    menu.toggle.label = this.locale.enable;
                    menu.toggle.image = data.url("resources/link-on.png");
                }
                if (state == 'excluded' || state == 'filtered') {
                    menu.manage.label = this.locale.include;
                    menu.manage.image = data.url("resources/link-include.png");
                } else {
                    menu.manage.label = this.locale.exclude;
                    menu.manage.image = data.url("resources/link-exclude.png");
                }
                if (state == 'not_processed') {
                    menu.manage.disabled = true;
                    menu.manage.image = data.url("resources/empty.png");
                } else {
                    menu.manage.disabled = false;
                }
                if (state != 'processed') {
                    menu.linkify.disabled = true;
                    menu.linkify.image = data.url("resources/empty.png");
                } else {
                    menu.linkify.disabled = false;
                    menu.linkify.image = data.url("resources/link-update.png");
                }
            }).bind(this)
        });

        let initial = status.initial;
		this.widget = widgets.Widget({
		    id: "widget-linkificator-markapola",
            type: 'view',
            menu: this.menu,
            
		    contentURL: data.url("widget/widget.html"),
		    contentScriptFile: data.url("widget/widget.js"),
            
		    label: "Linkificator",
            icon: initial.icon, 
            tooltip: initial.tooltip,

            removable: true,
            defaultArea: widgets.AREA_NAVBAR,
            stylesheet: 'chrome://linkificator/skin/widget.css', 
            showInPrivateBrowsing: true
        });
            
		this.update = function (tab, status) {
			let view = self.widget.getView(tab.window);
			if (!view) return;
            
			// set icon
			view.icon = status.icon;
			// set tooltip
			view.tooltip = status.tooltip;
		};
		status.on('update', this.update);

		this.statistics = function (tab, stats) {
			let view = self.widget.getView(tab.window);
			if (!view) return;
			
			// set tooltip
			view.tooltip = stats;
		};
		status.on('statistics', this.statistics);
	}
	Widget.prototype = {
		on: function (event, action) {
			if (event === 'mouseover') {
				this.widget.on('mouseover', action);
			} else if (event === 'middleclick') {
				this.widget.on('middleclick', action);
			} else if (event === 'rightclick') {
				this.widget.on('rightclick', action);
			}
		},

		destroy: function () {
			status.removeListener('update', this.update);
			status.removeListener('statistics', this.statistics);
			this.widget.destroy();
			this.menu.destroy();
		}
	};

	function createWidget () {
		var widget = new Widget();

		// bind middle click to specified action
		widget.on('middleclick', widgetActions[prefs.widgetMiddleClick]);
		// bind right click to specified action
		widget.on('rightclick', widgetActions[prefs.widgetRightClick]);
		// bind mouseover to retrieve statistics
		widget.on('mouseover', function (window) {
			if (isActive() && actions.statistics) {
				actions.statistics(window.tabs.activeTab);
			}
		});

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
		    if (isValidDocument(tab) && linkifyURL(tab)) {
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

	simplePrefs.on('widgetMiddleClick', function () {
        if (widget != null) {
		    widget.on('middleclick', widgetActions[prefs.widgetMiddleClick]);
        }
	});
	simplePrefs.on('widgetRightClick', function () {
        if (widget != null) {
		    widget.on('rightclick', widgetActions[prefs.widgetRightClick]);
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
    function toggle () {
		prefs.activated = !prefs.activated;
        return prefs.activated;
    }
    function isActive () {
        return prefs.activated;
    }
    function isActiveTab (tab) {
        if (tab === tabs.activeTab)
            return true;
        
        for each (let window in windows.browserWindows) {
            if (tab === window.tabs.activeTab)
                return true;
        }
        
        return false;
    }
	function isValidDocument (tab) {
		let contentType = tab.contentType;
		return contentType == 'text/html' || contentType == 'text/plain';
	}
    function linkifyURL (tab) {
        return includedURLs.isIncluded(tab) || configurator.linkifyURL(tab.url);
    }
    
	function reparse () {
		let tab = tabs.activeTab;

		if (actions.reparse
			&& isActive() && isValidDocument(tab) && linkifyURL(tab)) {
			actions.reparse(tab);
		}
	}

	function manage () {
		let activeTab = tabs.activeTab;

		if (isActive() && isValidDocument(activeTab)) {
            if (configurator.linkifyURL(activeTab.url)) {
			    let excluded = excludedURLs.toggle(activeTab.url);

                // process all tabs holding same content (i.e. same url)
                for each (let window in windows.browserWindows) {
                    for each (let tab in window.tabs) {
                        if (tab.url == activeTab.url) {
			                status.update(tab);
			                
			                if (excluded) {
				                actions.undo && actions.undo(tab);
			                } else {
				                actions.activate && actions.activate(tab);
			                }
                        }
                    }
                }
            } else {
                let included = includedURLs.toggle(activeTab);

                status.update(activeTab);
                    
                if (included) {
                    actions.activate && actions.activate(activeTab);
                } else {
                    actions.undo && actions.undo(activeTab);
                }
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
        
		linkifyURL: function (tab) {
			return !excludedURLs.isExcluded(tab.url) && linkifyURL(tab);
		},

        setStatus: function (tab) {
            includedURLs.update(tab);
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
