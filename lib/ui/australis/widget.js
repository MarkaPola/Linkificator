
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


const WidgetTrait = function (options) {
    if (!options) return;
    
    function loadStyleSheet (window) {
        stylesheets.loadSheet(window, options.stylesheet, 'user');
        
        unload((function () { stylesheets.removeSheet(window, options.stylesheet, 'user'); }).bind(this),
               window);
    }

    this.widget = null;
    this.widgetNodes = new Map();
    // map to associate SDK windows.BrowserWindow and DOMWindow
    this.windows = new Map();
    
    this.handlers = {
        mouseover: options.onMouseover,
        click: options.onClick,
        middleclick: options.onMiddleclick,
        rightclick: options.onRightclick
    };
    
    this.onMouseover = function (event) {
        if (this.handlers.mouseover)
            this.handlers.mouseover(this.windows.get(window_utils.getOwnerBrowserWindow(event.target)), event);
    }.bind(this);

    this.woptions = {
        onCreated: (function (node) {
            this.windows.set(windows.browserWindows.activeWindow, window_utils.getMostRecentBrowserWindow());
            this.windows.set(window_utils.getMostRecentBrowserWindow(), windows.browserWindows.activeWindow);
            
            if (options.icon) {
                node.classList.add(options.icon);
                this.widgetNodes.set(node, {icon: options.icon});
            }
            else
                this.widgetNodes.set(node, {icon: ''});
            
            if (options.panel && options.panel.onBuild) {
                options.panel.onBuild(node.ownerDocument);
            }
            
            node.addEventListener('mouseover', this.onMouseover);
            unload((function () {node.removeEventListener('mouseover', this.onMouseover);}).bind(this), node);
        }).bind(this),

        onClick: (function (event) {
            if (this.handlers.click) {
                this.handlers.click(this.windows.get(window_utils.getOwnerBrowserWindow(event.target)), event);
		        event.stopPropagation();
		        event.preventDefault();

                return;
	        }

            // middle-click
            if (event.button == 1 || (event.button == 0 && event.altKey == true)) {
		        if (this.handlers.middleclick) {
                    this.handlers.middleclick(this.windows.get(window_utils.getOwnerBrowserWindow(event.target)), event);
		            event.stopPropagation();
		            event.preventDefault();
	            }
            }
            // right-click
	        if (event.button == 2 || (event.button == 0 && event.shiftKey == true)) {
		        if (this.handlers.rightclick) {
                    this.handlers.rightclick(this.windows.get(window_utils.getOwnerBrowserWindow(event.target)), event);
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
        let browserWindow = this.windows.get(window);
        this.windows.delete(window);
        this.windows.delete(browserWindow);
    }).bind(this));
    
	let listener = {
        onWidgetInstanceRemoved: (function (id, document) {
            if (id !== options.id) {
				return;
			}

			let key = CustomizableUI.getWidget(id).forWindow(document.parentWindow).node;
			this.widgetNodes.delete(key);
        }).bind(this)
	};
    CustomizableUI.addListener(listener);

	this.destroyWidget = function () {
        this.windows.clear();
		this.widgetNodes.clear();
		CustomizableUI.removeListener(listener);
        CustomizableUI.destroyWidget(this.woptions.id);
	};
    unload((function () { this.destroyWidget(); }).bind(this));

    CustomizableUI.createWidget(this.woptions);
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
            var win = window instanceof windows.BrowserWindow ? wt.windows.get(window) : window;
            var instance = CustomizableUI.getWidget(wt.woptions.id).forWindow(win);
            
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
            CustomizableUI.getWidget(wt.woptions.id).instances.forEach(function (instance) {
                let config = wt.widgetNodes.get(instance.node);
                
                if (value !== config.icon) {
                    instance.node.classList.add(value);
                    instance.node.classList.remove(config.icon);

                    config.icon = value;
                }
            });
        },
        set tooltip (value) {
            CustomizableUI.getWidget(wt.woptions.id).instances.forEach(function (instance) {
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
