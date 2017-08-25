
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// file-picker.js - Linkificator's module
// author: MarkaPola


//
// Manage file picker UI
//

"use strict";

const {Cu, Cc, Ci} = require('chrome');
const {Services} = Cu.import('resource://gre/modules/Services.jsm');
const {FileUtils} = Cu.import('resource://gre/modules/FileUtils.jsm');
const nsIFilePicker = Ci.nsIFilePicker;


exports.show = function (window, mode, callback, properties) {
    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

    function fpCallback (result) {
        if (result != nsIFilePicker.returnCancel)
            callback(fp.file.path);
    }

    var fpMode = mode == "open" ? nsIFilePicker.modeOpen : nsIFilePicker.modeSave;

    if (properties.directory) {
        if (properties.directory == "<HOME>") {
            fp.displayDirectory = Services.dirsvc.get("Home", Ci.nsIFile);
        } else {
            fp.displayDirectory = new FileUtils.File(properties.directory);
        }
    }
    
    if (mode == "save" && properties.filename)
        fp.defaultString = properties.filename;
    
    if (properties.extension) {
        fp.defaultExtension = properties.extension;
        fp.appendFilter(properties.extension+" Files", "*."+properties.extension);
    }
    fp.appendFilters(fp.filterText+fp.filterAll);
    
    fp.init(window, properties.title, fpMode);

    fp.open(fpCallback);
};
