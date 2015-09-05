
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
    const popup = require('./ui/popup');

    
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
                icon: isActive() ? (isManual() ? 'linkificator-manual' : 'linkificator-on') : 'linkificator-off', 
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
					current.icon = isManual() ? 'linkificator-manual' : 'linkificator-on';
					current.tooltip = _("stats.links", 0) + " " + _("stats.time", 0);
				} else {
					current.state = 'filtered';
					current.icon = 'linkificator-excluded';
					current.tooltip = _("stats.filtered");
				}
			} else {
				current.icon = isActive() ? (isManual() ? 'linkificator-manual' : 'linkificator-on') : 'linkificator-off';
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
                    for (let window of windows.browserWindows) {
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
			        image: isManual() ? "chrome://linkificator/skin/link16-manual.png"
                                      : "chrome://linkificator/skin/link16-on.png",
			        data: "re-parse",
			        contentScriptFile: [data.url("state.js"), data.url("menu/menu.js")],
                    
			        onMessage: function (data) {
				        reparse();
			        }
		        });
            },

            update: function () {
                if (item)
                    item.image = isManual() ? "chrome://linkificator/skin/link16-manual.png"
                                            : "chrome://linkificator/skin/link16-on.png";
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
        manual: manual, 
		manage: manage,
		linkify: reparse
	};

    // High level widget
    function Widget () {
		var self = this;

        this.locale = {
            options: _("panel.options"),
			manual: _("panel.manual"),
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
                manual: {
                    label: this.locale.manual,
                    command: function () {
                        manual();
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
                                         image: "chrome://linkificator/skin/extension.png", 
                                         command: function (event) {
                                             let PanelUI = event.target.ownerDocument.defaultView.PanelUI;
                                             PanelUI.hide();
                                             window_utils.getMostRecentBrowserWindow().BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent('linkificator@markapola') + "/preferences");
                                         }}],
                      ['menuseparator', {}],
                      ['toolbarbutton', {key: 'manual',
                                         type: 'checkbox',
                                         checked: isManual() ? "true" : "false", 
                                         'class': 'subviewbutton',
                                         id: 'linkificator-manual',
                                         tabindex: '0',
                                         label: this.locale.manual,
                                         shortcut: prefs.hotkeyManual, 
                                         command: function (event) {
                                             let PanelUI = event.target.ownerDocument.defaultView.PanelUI;
                                             PanelUI.hide();
                                             manual();
                                         }}],
                      ['toolbarbutton', {key: 'toggle',
                                         'class': 'subviewbutton cui-withicon',
                                         id: 'linkificator-toggle',
                                         tabindex: '0',
                                         label: this.locale.disable,
                                         image: "chrome://linkificator/skin/link16-off.png",
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
                                         image: "chrome://linkificator/skin/link-exclude.png",
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
                                         image: "chrome://linkificator/skin/link-update.png",
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

                menu.manual.shortcut = prefs.hotkeyManual;
                menu.toggle.shortcut = prefs.hotkeyToggle;
                menu.manage.shortcut = prefs.hotkeyManage;
                menu.linkify.shortcut = prefs.hotkeyParse;

                menu.manual.checked = isManual();
                    
                if (active) {
                    menu.toggle.label = this.locale.disable;
                    menu.toggle.image = "chrome://linkificator/skin/link16-off.png";
                } else {
                    menu.toggle.label = this.locale.enable;
                    menu.toggle.image = isManual() ? "chrome://linkificator/skin/link16-manual.png"
                                                   : "chrome://linkificator/skin/link16-on.png";
                }
                if (state == 'excluded' || state == 'filtered') {
                    menu.manage.label = this.locale.include;
                    menu.manage.image = "chrome://linkificator/skin/link-include.png";
                } else {
                    menu.manage.label = this.locale.exclude;
                    menu.manage.image = "chrome://linkificator/skin/link-exclude.png";
                }
                if (state == 'not_processed') {
                    menu.manage.disabled = true;
                    menu.manage.image = "chrome://linkificator/skin/empty.png";
                } else {
                    menu.manage.disabled = false;
                }
                if (state != 'processed') {
                    menu.linkify.disabled = true;
                    menu.linkify.image = "chrome://linkificator/skin/empty.png";
                } else {
                    menu.linkify.disabled = false;
                    menu.linkify.image = "chrome://linkificator/skin/link-update.png";
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
	hotKeyManager.add('hotkeyManual', manual);
	hotKeyManager.add('hotkeyManage', manage);
	hotKeyManager.add('hotkeyParse', reparse);

	// handle events for various preferences changes
	simplePrefs.on('activated', function () {
		status.update();

        for (let window of windows.browserWindows) {
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

	simplePrefs.on('manual', function () {
        contextMenuManager.update();
		status.update();
		
		for (let window of windows.browserWindows) {
			let tab = window.tabs.activeTab;
			// handling of registered actions
			if (isValidDocument(tab) && linkifyURL(tab)) {
				if (!excludedURLs.isExcluded(tab.url)) {
					if (prefs.activated && actions.activate) {
						actions.activate(tab);
					}
				}
			}
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

		popup.display ("linkificator:advanced-settings",
					   "chrome://linkificator/content/advanced-options.xul",
					   parameters);
	});


    // Inline options customization and handling
	const preferencesService = require("sdk/preferences/service");
    const isAustralis = require('./util/system').australis;
    if (isAustralis) {
        preferencesService.reset('extensions.linkificator@markapola.displayWidget');
    }
    const {Cu} = require('chrome');
    const {Services} = Cu.import('resource://gre/modules/Services.jsm');

    var settings = {
        update: function () {
            // update current configurator properties
            let newProperties = configurator.properties;
            newProperties.ui = properties.ui;
            properties = newProperties;
        },
            
        set: function (data) {
            configurator.settings.set(data);

            this.update();
        },

        get: function () {
            return configurator.settings.get();
        },

        reset: function () {
            configurator.settings.reset();

            this.update();
        }
    };
    
    var observer = {
        listener: null,
        
        setFilterMode: function (options) {
            let whitelist = options.getElementById('settings.whitelist');
            let blacklist = options.getElementById('settings.blacklist');
            
            switch (prefs.filterMode) {
            case 'none':
                whitelist.setAttribute('disabled', true);
                blacklist.setAttribute('disabled', true);
                break;
            case 'white':
                whitelist.removeAttribute('disabled');
                blacklist.setAttribute('disabled', true);
                break;
            case 'black':
                whitelist.setAttribute('disabled', true);
                blacklist.removeAttribute('disabled');
                break;
            }
        },
        
        observe: function (aSubject, aTopic, aData) {
            if (aTopic == "addon-options-displayed" && aData == "linkificator@markapola") {
                if (isAustralis) {
                    // Do not display useless properties for Australis
                    let entry = aSubject.getElementById('settings.displayWidget');
                    entry.setAttribute('style', 'display:none');
                }

                // de-active useless domain lists
                this.setFilterMode (aSubject);

                this.listener = (function () {
		            this.setFilterMode (aSubject);
	            }).bind(this);
                simplePrefs.on('filterMode', this.listener);

                // configure popup menu
                let prefsMenu = aSubject.getElementById('settings.prefsMenu');

                prefsMenu.setAttribute("image", "chrome://linkificator/skin/utilities.png");
                prefsMenu.setAttribute("style", "min-width: 0; min-height: 0;");
                
                let entry = aSubject.getElementById('settings.prefs.defaults');
                entry.setAttribute("image", "chrome://linkificator/skin/arrow-circle.png");
                entry = aSubject.getElementById('settings.prefs.import');
                entry.setAttribute("image", "chrome://linkificator/skin/import.png");
                entry = aSubject.getElementById('settings.prefs.export');
                entry.setAttribute("image", "chrome://linkificator/skin/export.png");

                // sync checkbox configuration
                let sync = aSubject.getElementById('settings.prefs.sync');
                prefsMenu.addEventListener('mousedown', (function() {
                    sync.setAttribute("checked", prefs.sync?"true":"false");
                }).bind(this));
                if (require('sdk/system/runtime').OS == 'Darwin')
                    sync.setAttribute("image", "chrome://linkificator/skin/empty.png");
                
                // menu actions
                sync.addEventListener('click', (function() {
                    prefs.sync = sync.getAttribute("checked") == "true" ? false : true;
                }).bind(this));

                const filePicker = require('./ui/file-picker');
                const fileIO = require('sdk/io/file');
                var properties = {extension:"json",
                                  filename:"linkificator-settings.json",
                                  directory:"<HOME>"};
                
                var exportSettings = function () {
                    function write (file) {
                        var writer = fileIO.open(file, "w");
                        if (!writer.closed) {
                            writer.write(settings.get());
                            writer.close();
                            
                            properties.directory = fileIO.dirname(file);
                        }
                    }

                    properties.title = _('export.title');
                    filePicker.show(window_utils.getMostRecentBrowserWindow(), "save", write, properties);
                };
                aSubject.getElementById('settings.prefs.export').addEventListener('command', exportSettings.bind(this));
                
                var importSettings = function () {
                    function read (file) {
                        var data = null;
                        if (fileIO.exists(file)) {
                            var reader = fileIO.open(file, "r");
                            if (!reader.closed) {
                                data = reader.read();
                                reader.close();
                                
                                settings.set(data);
                                
                                properties.directory = fileIO.dirname(file);
                            }
                        }
                    }

                    properties.title = _('import.title');
                    filePicker.show(window_utils.getMostRecentBrowserWindow(), "open", read, properties);
                };
                aSubject.getElementById('settings.prefs.import').addEventListener('command', importSettings.bind(this));

                aSubject.getElementById('settings.prefs.defaults').addEventListener('command', (function() {
                    if (popup.confirm(null, _('reset.title'), _('reset.message'))) {
                        settings.reset();
                    }
                }).bind(this));
            }
        },

        unload: function (reason) {
            simplePrefs.removeListener('filterMode', this.listener);
            Services.obs.removeObserver(observer, "addon-options-displayed");
        }
    };
    Services.obs.addObserver(observer, "addon-options-displayed", false);

    require('sdk/system/unload').ensure(observer);
    

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
        
        for (let window of windows.browserWindows) {
            if (tab === window.tabs.activeTab)
                return true;
        }
        
        return false;
    }
	function isValidDocument (tab) {
		let contentType = tab.contentType;
		
		return contentType.startsWith('text/html') || contentType.startsWith('text/plain')
			|| contentType.startsWith('application/xhtml');
	}
    function linkifyURL (tab) {
        return includedURLs.isIncluded(tab) || configurator.linkifyURL(tab.url);
    }

    function manual ()
    {
		prefs.manual = !prefs.manual;
        return prefs.manual;
    }
    function isManual () {
        return prefs.manual;
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
                for (let window of windows.browserWindows) {
                    for (let tab of window.tabs) {
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
