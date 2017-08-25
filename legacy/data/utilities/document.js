
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// dom.js - Linkificator's module
// author: MarkaPola
//

//
// DOcument tools
//

/*
 * Retrieve MIME type from DOM Document
 *
 * @param [object] document: DOM Document object
 */

function Document (doc) {
    "use strict";

    var document = doc;

    return {
        get contentType () {
            let contentType = null;

            if (document) {
                // specify multiple CSS Selectors because 'i' flag is not supported before FF47
                let ct = document.querySelector('meta[http-equiv="content-type"], meta[http-equiv="Content-Type"], meta[http-equiv="Content-type"], meta[http-equiv="content-Type"]');
                if (ct) {
                    let content = ct.getAttribute('content');
                    if (content) {
                        contentType = content.trim().split(/;|\s/)[0];
                    }
                }

                if (! contentType) {
                    // Check possible plain text page
                    if (document.querySelector('link[href="resource://gre-resources/plaintext.css"]')) {
                        contentType = 'text/plain';
                    }
                }
            }
            
            if (! contentType) {
                contentType = 'text/html';
            }
            
            return contentType;
        }
    };
}
