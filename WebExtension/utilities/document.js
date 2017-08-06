
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// document.js - Linkificator's module
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
                let ct = document.querySelector('meta[http-equiv="content-type" i]');
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
