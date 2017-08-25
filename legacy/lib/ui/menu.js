
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// menu.js - Linkificator's module
// author: MarkaPola


//
// Manage High Level UI elements
//

"use strict";

var menus = require('./australis/menu');


exports.Menu = function (options) {
    return menus.Menu(options);
};

