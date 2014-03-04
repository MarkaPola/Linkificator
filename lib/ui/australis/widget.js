
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

const stylesheets = require('sdk/stylesheet/utils');

const unload = require('../../util/unload').unload;
const watchWindows = require('../../util/windows').watchWindows;


// exports some useful constonts from CustomizableUI
exports.AREA_PANEL = CustomizableUI.AREA_PANEL;
exports.AREA_NAVBAR = CustomizableUI.AREA_NAVBAR;
exports.AREA_MENUBAR = CustomizableUI.AREA_MENUBAR;
exports.AREA_TABSTRIP = CustomizableUI.AREA_TABSTRIP;
exports.AREA_BOOKMARKS = CustomizableUI.AREA_BOOKMARKS;


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
    
    this.woptions = {
        onCreated: (function (node) {
            if (options.icon) {
                node.classList.add(options.icon);
                this.widgetNodes.set(node, {icon: options.icon});
            }
            
            if (options.panel && options.panel.onBuild) {
                options.panel.onBuild(node.ownerDocument);
            }
            
            if (this.handlers.mouseover) {
                node.addEventListener('mouseover', this.handlers.mouseover);
                unload((function () {node.removeEventListener('mouseover', this.handlers.mouseover);}).bind(this), node);
            }
        }).bind(this),

        onClick: (function (event) {
            if (this.handlers.click) {
                this.handlers.click(event);
		        event.stopPropagation();
		        event.preventDefault();

                return;
	        }

            // middle-click
            if (event.button == 1 || (event.button == 0 && event.altKey == true)) {
		        if (this.handlers.middleclick) {
                    this.handlers.middleclick(event);
		            event.stopPropagation();
		            event.preventDefault();
	            }
            }
            // right-click
	        if (event.button == 2 || (event.button == 0 && event.shiftKey == true)) {
		        if (this.handlers.rightclick) {
                    this.handlers.rightclick(event);
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
            var instance = CustomizableUI.getWidget(wt.woptions.id).forWindow(window);
            
            return {
                set icon (value) {
					if (instance) {
                        let config = wt.widgetNodes.get(instance.node);
                        
                        instance.node.classList.add(value);
                        instance.node.classList.remove(config.icon);

                        config.icon = value;
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
                
                instance.node.classList.add(value);
                instance.node.classList.remove(config.icon);

                config.icon = value;
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
