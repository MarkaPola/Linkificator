/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// system.js - Linkificator's module
// author: MarkaPola
//

//
// Manage configuration
//

var australis = true;

try {
  require('chrome').Cu.import('resource:///modules/CustomizableUI.jsm', {});
}
catch (e) {
  australis = false;
}

Object.defineProperty(exports, "australis", {
    enumerable: true,
    get: (function () {
        return australis;
    }).bind(this)
});


function versionCompare (v1, v2) {
    const {Cu, Ci} = require('chrome');
	const {Services} = Cu.import('resource://gre/modules/Services.jsm');

    return Services.vc.compare(v1, v2);
}

exports.versionCompare = versionCompare;
