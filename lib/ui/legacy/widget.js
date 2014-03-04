
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// legacy/widget.js - Linkificator's module
// author: MarkaPola


//
// Manage legacy UI elements
//


"use strict";

var windows = require("sdk/windows");
var widgets = require('sdk/widget');

const WidgetTrait = function (options) {
    if (!options) return;

    this.widget = null;

    this.handlers = {
        mouseover: options.onMouseover,
        click: options.onClick,
        middleclick: options.onMiddleclick,
        rightclick: options.onRightclick
    };

    this.woptions = {
		onMouseover: (function () {
			if (this.handlers.mouseover) {
				this.handlers.mouseover();
			}
		}).bind(this),
        
        onClick: (function (event) {
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
    var validOptions = ['id', 'label', 'content', 'contentURL', 'contentScriptFile', 'contentScript', 'contentScriptWhen', 'contentScriptOptions', 'tooltip'];
    validOptions.forEach((function (option) {
        if (options[option])
            this.woptions[option] = options[option];
    }).bind(this));

    this.widget = widgets.Widget(this.woptions);
    if (this.panel) {
        this.panel.position = this.widget;
    }
    
    this.widget.port.on("middleclick", (function () {
		if (this.handlers.middleclick) {
			this.handlers.middleclick();
		}
	}).bind(this));
	this.widget.port.on("rightclick", (function () {
		if (this.handlers.rightclick) {
			this.handlers.rightclick();
		}
	}).bind(this));

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
            for each (var window in windows.browserWindows) {
                let view = wt.widget.getView(window);
			    if (view) {
			        // set icon
			        view.port.emit('icon', value);
                }
            }
        },
        set tooltip (value) {
            // update all windows
            for each (var window in windows.browserWindows) {
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

