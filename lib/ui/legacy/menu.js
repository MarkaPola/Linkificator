
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// legacy/menu.js - Linkificator's module
// author: MarkaPola


//
// Manage legacy UI elements
//


"use strict";

const panels = require('./panel');


const MenuTrait = function (options) {
    if (!options) return;

    this.entries = options.entries;
    delete options.entries;

    this.menu = {};
    
    this.handlers = {
        show: options.onShow,
        hide: options.onHide
    };
    
    this.onShow = function () {
        if (this.handlers.show)
            this.handlers.show(this.menu);
    }.bind(this);
    this.onHide = function () {
        if (this.handlers.hide)
            this.handlers.hide(this.menu);
    }.bind(this);

    if (options.onShow)
        options.onShow = this.onShow;
    if (options.onHide)
        options.onHide = this.onHide;
    
    this.panel = panels.Panel(options);
    
    for (let id in this.entries) {
        let self = this;
        let key = id;
        // add management interface for each menu entry
        this.menu[id] = {
            set label (data) {
                self.panel.port.emit('label', {id: key,
                                               value: data});
            },
            set disabled (data) {
                self.panel.port.emit('disabled', {id: key,
                                                  value: data});
            }
        };
    }
    
    // initialize menu elements
    for (let id in this.entries) {
        let entry = this.entries[id];
        
        if (entry.label)
            this.menu[id].label = entry.label;
        if (entry.disabled)
            this.menu[id].disabled = entry.disabled;

        if (entry.command) {
            let command = entry.command;
            this.panel.port.on(id, (function () {
		 		this.panel.hide();
		 		command();
		 	}).bind(this));
        }
    }
};

exports.Menu = function (options) {
    if (!options.entries) {
        throw new Error("entries option is required");
    }
    
    var mt = new MenuTrait(options);

    return {
        get panel () {
            return mt.panel;
        },

        on: function (event, action) {
            if (event === 'show') {
				mt.handlers.show = action;
			} else if (event === 'hide') {
				mt.handlers.hide = action;
			}
        },

        destroy: function () {
            mt.panel.destroy();
        }
    };
};
