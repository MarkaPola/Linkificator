
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// windows.js - Linkificator's module
// author: MarkaPola
//
// This code is derived from work done by Mardak (see https://github.com/Mardak/restartless/blob/watchWindows/bootstrap.js)
//


//
// Manage windows objects creation
//

/**
* Apply a callback to each open and new browser windows.
*
* @usage watchWindows(callback): Apply a callback to each browser window.
* @param [function] callback: 1-parameter function that gets a browser window.
*/
function watchWindows (callback) {
    const {Cu, Ci} = require('chrome');
	const {Services} = Cu.import('resource://gre/modules/Services.jsm');

    const unload = require('./unload').unload;
    
    // Wrap the callback in a function that ignores failures
    function watcher (window) {
        try {
            // Now that the window has loaded, only handle browser windows
            let {documentElement} = window.document;
            if (documentElement.getAttribute("windowtype") == "navigator:browser")
                callback(window);
        } catch(ex) {}
    }

    // Wait for the window to finish loading before running the callback
    function runOnLoad(window) {
        // Listen for one load event before checking the window type
        window.addEventListener("DOMContentLoaded", function runOnce () {
            window.removeEventListener("DOMContentLoaded", runOnce, false);
            watcher(window);
        }, false);
    }

    // Add functionality to existing windows
    let windows = Services.wm.getEnumerator("navigator:browser");
    while (windows.hasMoreElements()) {
        // Only run the watcher immediately if the window is completely loaded
        let window = windows.getNext();
        if (window.document.readyState == "complete")
            watcher(window);
        // Wait for the window to load before continuing
        else
            runOnLoad(window);
    }

    let windowListener = {
        onOpenWindow: function (xulWindow) {
            let window = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
            runOnLoad(window);
        },

        onCloseWindow: function (xulWindow) {},
        onWindowTitleChange: function (xulWindow) {}
    };
    
    // Watch for new browser windows opening then wait for it to load
    Services.wm.addListener(windowListener);

    // Make sure to stop watching for windows if we're unloading
    unload(function() { Services.wm.removeListener(windowListener); });
}

exports.watchWindows = watchWindows;
