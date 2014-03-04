
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// panel.js - Linkificator's module
// author: MarkaPola


//
// Manage High Level UI elements
//

"use strict";

const useAustralis = require('../util/system').australis;

var panels;
if (useAustralis)
    panels = require('./australis/panel');
else
    panels = require('./legacy/panel');

var validOptions = ['onShow', 'onHide', 'id'];

if (useAustralis) {
    validOptions.push('content');
} else {
    validOptions.push('width', 'height', 'contentURL', 'contentScriptFile', 'contentScript', 'contentScriptWhen', 'contentScriptOptions');
}


exports.Panel = function (options) {
    let opts = {};
    
    // handle options
    validOptions.forEach(function (option) {
        if (options[option])
            opts[option] = options[option];
    });

    return panels.Panel(opts);
};

