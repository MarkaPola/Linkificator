
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// widget.js - Linkificator's module
// author: MarkaPola


//
// Manage High Level UI elements
//

"use strict";

var widgets = require('./australis/widget');

exports.Widget = function (options) {
    // check validity of properties
    if (options.panel && options.menu) {
        throw new Error("panel and menu options are mutually exclusive");
    }
    
    // handle options
    if (options.menu) {
        options.panel = options.menu.panel;
    }
    
    return widgets.Widget(options);
};

