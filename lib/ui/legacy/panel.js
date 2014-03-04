
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// legacy/panel.js - Linkificator's module
// author: MarkaPola


//
// Manage legacy UI elements
//


"use strict";

var widgets = require('sdk/widget');
var panels = require('sdk/panel');
var window_utils = require('sdk/window/utils');

const PanelTrait = function (options) {
    if (!options) return;
    
    this.wid = null;
    this.show = null;

    if (options.position instanceof widgets.Widget) {
        // Compute id of toolbar item
        this.wid = "widget:" + require("sdk/self").id + "-" + options.position.id;
        delete options.position;
    }

    this.panel = panels.Panel(options);
    this.show = this.panel.show.bind(this.panel);

    Object.defineProperty(this.panel, "id", {
        enumerable: true,
        get: (function () {
            return options.id;
        }).bind(this)
    });
    Object.defineProperty(this.panel, "position", {
        enumerable: true,
        set: (function (anchor) {
            if (anchor instanceof widgets.Widget) {
                // Compute id of toolbar item
                this.wid = "widget:" + require("sdk/self").id + "-" + anchor.id;
            } else {
                this.wid = null;
            }
        }).bind(this)
    });

    // override show method
    this.panel.show = (function (anchor) {
        if (anchor === undefined && !this.wid) {
            this.show();
        } else {
            let id = anchor ? anchor : this.wid;
            let node = window_utils.getMostRecentBrowserWindow().document.getElementById(id);
            // display panel anchored to widget
            if (this.show.length === 2) {
                this.show(null, node);
            } else {
                this.show(node);
            }
        }
    }).bind(this);
};

exports.Panel = function (options) {
    var pt = new PanelTrait(options);

    return pt.panel;
};
