
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// panel.js - Linkificator's module
// author: MarkaPola


//
// Manage High Level UI elements
//

"use strict";

var panels = require('./australis/panel');

exports.Panel = function (options) {
    return panels.Panel(options);
};

