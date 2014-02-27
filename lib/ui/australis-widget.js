
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// australis-widget.js - Linkificator's module
// author: MarkaPola


//
// Manage Australis UI elements
//

"use strict";

const { Cu, Cc, Ci } = require('chrome');
const { CustomizableUI } = Cu.import("resource:///modules/CustomizableUI.jsm");

// exports some useful constonts from CustomizableUI
exports.AREA_PANEL = CustomizableUI.AREA_PANEL;
exports.AREA_NAVBAR = CustomizableUI.AREA_NAVBAR;
exports.AREA_MENUBAR = CustomizableUI.AREA_MENUBAR;
exports.AREA_TABSTRIP = CustomizableUI.AREA_TABSTRIP;
exports.AREA_BOOKMARKS = CustomizableUI.AREA_BOOKMARKS;


exports.Widget = function (options) {
    const unload = require('../util/unload').unload;
    const watchWindows = require('../util/windows').watchWindows;

    var widgetNodes = new Map();
    
    function loadStyleSheet (window) {
        const stylesheets = require('sdk/stylesheet/utils');

        stylesheets.loadSheet(window, options.stylesheet, 'user');

        unload(function () { stylesheets.removeSheet(window, options.stylesheet, 'user'); },
               window);
    }

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

    var woptions = {
        onCreated: (function (node) {
            if (options.icon) {
                node.classList.add(options.icon);
                widgetNodes.set(node, {icon: options.icon});
            }
            
            if (options.panel && options.panel.onBuild) {
                options.panel.onBuild(node.ownerDocument);
            }
            
            if (options.onMouseOver) {
                node.addEventListener('mouseover', options.onMouseOver);
                unload(function () {node.removeEventListener('mouseover', options.onMouseOver);}, node);
            }
        }).bind(this),

        onClick: (function (event) {
            if (options.onClick) {
                options.onClick(event, widget);
		        event.stopPropagation();
		        event.preventDefault();

                return;
	        }

            // middle-click
            if (event.button == 1 || (event.button == 0 && event.altKey == true)) {
		        if (options.onMiddleClick) {
                    options.onMiddleClick(event, widget);
		            event.stopPropagation();
		            event.preventDefault();
	            }
            }
            // right-click
	        if (event.button == 2 || (event.button == 0 && event.shiftKey == true)) {
		        if (options.onRightClick) {
                    options.onRightClick(event, widget);
		            event.stopPropagation();
		            event.preventDefault();
	            }
            }
            // left-click
		    if (options.onLeftClick) {
                options.onLefttClick(event, widget);
		        event.stopPropagation();
		        event.preventDefault();
	        }
        }).bind(this)
    };

    if (options.panel) {
        woptions.viewId = options.panel.id;
    }
    if (options.tooltip) {
        woptions.tooltiptext = options.tooltip;
    }
    if (options.stylesheet) {
        watchWindows(loadStyleSheet);
    }
    woptions.defaultArea = options.defaultArea ? options.defaultArea : CustomizableUI.AREA_NAVBAR;
    
    // populate woptions from options for other options
    var validOptions = ['id', 'type', 'label', 'removable', 'overflows', 'shortcutId', 'showInPrivateBrowsing'];
    validOptions.forEach(function (option) {
        woptions[option] = options[option];
    });
    
    // connect some listeners
	var listener = {
        onWidgetInstanceRemoved: (function (id, document) {
            if (id !== options.id) {
				return;
			}

			let key = CustomizableUI.getWidget(id).forWindow(document.parentWindow).node;
			widgetNodes.delete(key);
        }).bind(this)
	};
    CustomizableUI.addListener(listener);

	function destroyWidget () {
		widgetNodes.clear();
		CustomizableUI.removeListener(listener);
        CustomizableUI.destroyWidget(woptions.id);
	};
    unload(function () { destroyWidget(); });

    CustomizableUI.createWidget(woptions);

    var widget =  {
        destroy: function () {
			destroyWidget();
		},
        
        getView: function (window) {
            var instance = CustomizableUI.getWidget(woptions.id).forWindow(window);
            
            return {
                set icon (value) {
					if (instance) {
                        let config = widgetNodes.get(instance.node);
                        
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
            CustomizableUI.getWidget(woptions.id).instances.forEach(function (instance) {
                let config = widgetNodes.get(instance.node);
                
                instance.node.classList.add(value);
                instance.node.classList.remove(config.icon);

                config.icon = value;
            });
        },
        set tooltip (value) {
            CustomizableUI.getWidget(woptions.id).instances.forEach(function (instance) {
                instance.node.tooltipText = value;
            });
        }
    };

    return widget;
};
