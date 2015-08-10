
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// australis/widget.js - Linkificator's module
// author: MarkaPola


//
// Manage Australis UI elements
//

"use strict";

const { Cu, Cc, Ci } = require('chrome');
const { CustomizableUI } = Cu.import("resource:///modules/CustomizableUI.jsm");

const windows = require("sdk/windows");
const window_utils = require('sdk/window/utils');
const stylesheets = require('sdk/stylesheet/utils');

const unload = require('../../util/unload').unload;
const watchWindows = require('../../util/windows').watchWindows;

var { versionCompare } = require('../../util/system');

var windowManager;
if (versionCompare(require('sdk/system').version, '31.*') < 0)
    windowManager = (function () {
        // map to associate SDK windows.BrowserWindow and DOMWindow
        var windows = new Map();

        return {
            set: function (w1, w2) {
                windows.set(w1, w2);
                windows.set(w2, w1);
            },
            close: function (window) {
                let browserWindow = windows.get(window);
                windows.delete(window);
                windows.delete(browserWindow);
            },
            clear: function () {
                windows.clear();
            }, 
            viewFor: function( window) {
                return windows.get(window);
            },
            modelFor: function (window) {
                return windows.get(window);
            }
        };
    })();
else
    windowManager = (function () {
        const view = require('sdk/view/core');
        const model = require('sdk/model/core');

        return {
            set: function (w1, w2) {
            },
            close: function (window) {
            },
            clear: function () {
            },
            viewFor: function (window) {
                return view.viewFor(window);
            },
            modelFor: function (window) {
                return model.modelFor(window);
            }
        };
    })();


const WidgetTrait = function (options) {
    if (!options) return;
    
    function loadStyleSheet (window) {
        stylesheets.loadSheet(window, options.stylesheet, 'user');
        
        unload((function () { stylesheets.removeSheet(window, options.stylesheet, 'user'); }).bind(this),
               window);
    }

    this.widget = null;
    this.widgetNodes = new Map();
    
    this.handlers = {
        mouseover: options.onMouseover,
        click: options.onClick,
        middleclick: options.onMiddleclick,
        rightclick: options.onRightclick
    };
    
    this.onMouseover = function (event) {
        if (this.handlers.mouseover)
            this.handlers.mouseover(windowManager.modelFor(window_utils.getOwnerBrowserWindow(event.target)), event);
    }.bind(this);

    this.woptions = {
        onCreated: (function (node) {
            windowManager.set (windows.browserWindows.activeWindow, node.ownerDocument.defaultView);
            
            if (options.icon) {
                node.classList.add(options.icon);
                this.widgetNodes.set(node, {icon: options.icon});
            }
            else
                this.widgetNodes.set(node, {icon: ''});
            
            node.addEventListener('mouseover', this.onMouseover);
            unload((function () {node.removeEventListener('mouseover', this.onMouseover);}).bind(this), node);
        }).bind(this),

        onClick: (function (event) {
            if (this.handlers.click) {
                this.handlers.click(windowManager.modelFor(window_utils.getOwnerBrowserWindow(event.target)), event);
		        event.stopPropagation();
		        event.preventDefault();

                return;
	        }

            // middle-click
            if (event.button == 1 || (event.button == 0 && event.altKey == true)) {
		        if (this.handlers.middleclick) {
                    this.handlers.middleclick(windowManager.modelFor(window_utils.getOwnerBrowserWindow(event.target)), event);
		            event.stopPropagation();
		            event.preventDefault();
	            }
            }
            // right-click
	        if (event.button == 2 || (event.button == 0 && event.shiftKey == true)) {
		        if (this.handlers.rightclick) {
                    this.handlers.rightclick(windowManager.modelFor(window_utils.getOwnerBrowserWindow(event.target)), event);
		            event.stopPropagation();
		            event.preventDefault();
	            }
            }
        }).bind(this)
    };
    
    if (options.panel) {
        this.woptions.viewId = options.panel.id;
    }
    if (options.tooltip) {
        this.woptions.tooltiptext = options.tooltip;
    }
    if (options.stylesheet) {
        watchWindows(loadStyleSheet);
    }
    this.woptions.defaultArea = options.defaultArea ? options.defaultArea : CustomizableUI.AREA_NAVBAR;
    // populate woptions from options for other options
    var validOptions = ['id', 'type', 'label', 'removable', 'overflows', 'shortcutId', 'showInPrivateBrowsing'];
    validOptions.forEach((function (option) {
        if (options[option])
            this.woptions[option] = options[option];
    }).bind(this));
    
    // connect some listeners
    windows.browserWindows.on('close', (function (window) {
        windowManager.close(window);
    }).bind(this));
    
	let listener = {
        onWidgetInstanceRemoved: (function (id, document) {
            if (id !== options.id) {
				return;
			}

			this.widgetNodes.delete(document.getElementById(id));
        }).bind(this)
	};
    CustomizableUI.addListener(listener);

	this.destroyWidget = function () {
        windowManager.clear();
		this.widgetNodes.clear();
		CustomizableUI.removeListener(listener);
        CustomizableUI.destroyWidget(this.woptions.id);
	};
    unload((function () { this.destroyWidget(); }).bind(this));

    this.widget = CustomizableUI.createWidget(this.woptions);
};

exports.Widget = function (options) {
    // check validity of properties
    if (options.type === 'view') {
        if (!options.panel) {
            throw new Error("panel option required for view type");
        }
    } else {
        if (options.panel) {
            throw new Error("panel option only valid for view type");
        }
    }

    let wt = new WidgetTrait(options);
    
    return {
        on: function (event, action) {
            if (event === 'mouseover') {
				wt.handlers.mouseover = action;
			} else if (event === 'click') {
				wt.handlers.click = action;
			} else if (event === 'middleclick') {
				wt.handlers.middleclick = action;
			} else if (event === 'rightclick') {
				wt.handlers.rightclick = action;
			}
        },
        
        getView: function (window) {
            let win = windowManager.viewFor(window);
            let instance = null;
            try {
                instance = win ? wt.widget.forWindow(win) : null;
            } catch (e) {
                // can be called too early: no document attached to window
            }
            if (!instance) return null;
            
            return {
                set icon (value) {
					if (instance) {
                        let config = wt.widgetNodes.get(instance.node);
                        if (value !== config.icon) {
                            instance.node.classList.add(value);
                            instance.node.classList.remove(config.icon);

                            config.icon = value;
                        }
                    }
                },

                set tooltip (value) {
					if (instance) {
                        instance.node.tooltipText = value;
                    }
                }
            };
        },

        set icon (value) {
            wt.widget.instances.forEach(function (instance) {
                let config = wt.widgetNodes.get(instance.node);
                
                if (value !== config.icon) {
                    instance.node.classList.add(value);
                    instance.node.classList.remove(config.icon);

                    config.icon = value;
                }
            });
        },
        set tooltip (value) {
            wt.widget.instances.forEach(function (instance) {
                instance.node.tooltipText = value;
            });
        }, 
        
        destroy: function () {
			wt.destroyWidget();
		}
    };
};

// exports some useful constonts from CustomizableUI
exports.AREA_PANEL = CustomizableUI.AREA_PANEL;
exports.AREA_NAVBAR = CustomizableUI.AREA_NAVBAR;
exports.AREA_MENUBAR = CustomizableUI.AREA_MENUBAR;
exports.AREA_TABSTRIP = CustomizableUI.AREA_TABSTRIP;
exports.AREA_BOOKMARKS = CustomizableUI.AREA_BOOKMARKS;
