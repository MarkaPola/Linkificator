
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// widget.js - Linkificator's module
// author: MarkaPola


//
// Manage High Level UI elements
//

"use strict";

const useAustralis = require('../util/system').australis;

var widgets;
if (useAustralis)
    widgets = require('./australis/widget');
else
    widgets = require('./legacy/widget');

var validOptions = ['onMouseover', 'onClick', 'onMiddleclick', 'onRightclick',  'id', 'type', 'panel', 'label', 'icon', 'tooltip'];

if (useAustralis) {
    validOptions.push('stylesheet', 'removable', 'overflows', 'shortcutId', 'showInPrivateBrowsing');
} else {
    validOptions.push('content', 'contentURL', 'contentScriptFile', 'contentScript', 'contentScriptWhen', 'contentScriptOptions');
}

if (!useAustralis) {
    Object.defineProperties(exports, {
        'AREA_PANEL': {
            enumerable: true,
            get: function () { return ''; }
        }, 
        'AREA_MENUBAR': {
            enumerable: true,
            get: function () { return ''; }
        }, 
        'AREA_TABSTRIP': {
            enumerable: true,
            get: function () { return ''; }
        }, 
        'AREA_BOOKMARKS': {
            enumerable: true,
            get: function () { return ''; }
        }
    });
}

exports.Widget = function (options) {
    // check validity of properties
    if (options.panel && options.menu) {
        throw new Error("panel and menu options are mutually exclusive");
    }
    
    let opts = {};
    
    // handle options
    if (options.menu) {
        opts.panel = options.menu.panel;
    }
    
    validOptions.forEach(function (option) {
        if (options[option])
            opts[option] = options[option];
    });

    return widgets.Widget(opts);
};

