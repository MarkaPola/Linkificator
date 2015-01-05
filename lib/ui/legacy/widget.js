
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// legacy/widget.js - Linkificator's module
// author: MarkaPola


//
// Manage legacy UI elements
//


"use strict";

const browserWindows = require("sdk/windows").browserWindows;
const widgets = require('sdk/widget');


const WidgetTrait = function (options) {
    if (!options) return;
    
    this.handlers = {
        mouseover: options.onMouseover,
        click: options.onClick,
        middleclick: options.onMiddleclick,
        rightclick: options.onRightclick
    };

    this.woptions = {
        onAttach: (function (view) {
            let handlers = this.handlers;
            let window = browserWindows.activeWindow;

            // attach mouseover event handling
            function onMouseOver () {
                if (handlers.mouseover) {
				    handlers.mouseover(window);
			    }
            }
            view.on('mouseover', onMouseOver);

            // attach various click event handling
            function onMiddleClick () {
                if (handlers.middleclick) {
				    handlers.middleclick(window);
			    }
            }
            view.port.on("middleclick", onMiddleClick);
            
            function onRightClick () {
                if (handlers.rightclick) {
				    handlers.rightclick(window);
			    }
            }
	        view.port.on("rightclick", onRightClick);
        }).bind(this),
        
        onClick: (function () {
            if (this.handlers.click) {
                this.handlers.click();
	        }
        }).bind(this)
    };
    
    if (options.panel) {
        this.panel = options.panel;
        this.handlers.click = this.panel.show;
        delete options.panel;
    }
    
    // populate woptions from options for other options
    var validOptions = ['id', 'label', 'tooltip', 'content', 'contentURL', 'contentScriptFile', 'contentScript', 'contentScriptWhen', 'contentScriptOptions'];
    validOptions.forEach((function (option) {
        if (options[option])
            this.woptions[option] = options[option];
    }).bind(this));
    
    this.widget = widgets.Widget(this.woptions);
    if (this.panel) {
        this.panel.position = this.widget;
    }
    
    if (options.icon) {
        this.widget.port.emit('icon', options.icon);
    }

    this.destroyWidget = function () {
		this.widget.destroy();
	};
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
            var view = wt.widget.getView(window);

            return {
                set icon (value) {
					if (view) {
                        view.port.emit('icon', value);
                    }
                },

                set tooltip (value) {
					if (view) {
                        view.tooltip = value;
                    }
                }
            };
        },
        
        set icon (value) {
            // update all windows
            for (let window of browserWindows) {
                let view = wt.widget.getView(window);
			    if (view) {
			        // set icon
			        view.port.emit('icon', value);
                }
            }
        },
        set tooltip (value) {
            // update all windows
            for (let window of browserWindows) {
                let view = wt.widget.getView(window);
			    if (view) {
			        // set icon
			        view.tooltip = value;
                }
            }
        }, 
 
        destroy: function () {
            wt.destroyWidget();
        }
    };
};

