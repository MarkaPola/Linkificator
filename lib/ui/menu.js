
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// menu.js - Linkificator's module
// author: MarkaPola


//
// Manage High Level UI elements
//

"use strict";

const useAustralis = require('../util/system').australis;

var menus;
if (useAustralis)
    menus = require('./australis/menu');
else
    menus = require('./legacy/menu');

var validOptions = ['onShow', 'onHide', 'id'];

if (useAustralis) {
    validOptions.push('content');
} else {
    validOptions.push('width', 'height', 'entries', 'contentURL', 'contentScriptFile', 'contentScript', 'contentScriptWhen', 'contentScriptOptions');
}


exports.Menu = function (options) {
    let opts = {};
    
    // handle options
    validOptions.forEach(function (option) {
        if (options[option])
            opts[option] = options[option];
    });

    return menus.Menu(opts);
};

