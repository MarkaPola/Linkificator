/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// unload.js - Linkificator's module
// author: MarkaPola
//
// This code is derived from work done by Mardak (see https://github.com/Mardak/restartless/blob/watchWindows/bootstrap.js)
//

//
// Manage actions on unload
//

/**
* Save callbacks to run when unloading. Optionally scope the callback to a
* container, e.g., window. Unload will be done automatically on add-on unload.
* Provide a way to run all the callbacks.
*
* @usage unload(): Run all callbacks and release them.
*
* @usage unload(callback): Add a callback to run on unload.
* @param [function] callback: 0-parameter function to call on unload.
* @return [function]: A 0-parameter function that undoes adding the callback.
*
* @usage unload(callback, container) Add a scoped callback to run on unload.
* @param [function] callback: 0-parameter function to call on unload.
* @param [node] container: Remove the callback when this container unloads.
* @return [function]: A 0-parameter function that undoes adding the callback.
*/
function unload (callback, container) {
    // Initialize the array of unloaders and global unload on the first usage
    let unloaders = unload.unloaders;
    if (unloaders == null) {
        unloaders = unload.unloaders = [];

        // execute unload on add-on unload
        require('sdk/system/unload').when(function(reason) { unload(); });
    }
    
    // Calling with no arguments runs all the unloader callbacks
    if (callback == null) {
        unloaders.slice().forEach(function(unloader) unloader());
        unloaders.length = 0;
        return undefined;
    }

    // The callback is bound to the lifetime of the container if we have one
    if (container != null) {
        // Remove the unloader when the container unloads
        container.addEventListener("unload", removeUnloader, false);

        // Wrap the callback to additionally remove the unload listener
        let origCallback = callback;
        callback = function() {
            container.removeEventListener("unload", removeUnloader, false);
            origCallback();
        };
    }

    // Wrap the callback in a function that ignores failures
    function unloader() {
        try {
            callback();
        } catch(ex) {}
    }
    unloaders.push(unloader);

    // Provide a way to remove the unloader
    function removeUnloader() {
        let index = unloaders.indexOf(unloader);
        if (index != -1)
            unloaders.splice(index, 1);
    }
    return removeUnloader;
}

exports.unload = unload;
