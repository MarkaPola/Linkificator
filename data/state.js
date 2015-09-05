
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* state parsing management - Linkificator's module
 * author: MarkaPola */

function State (document) {
    "use strict";

	const statusLabel = "linkificator-status";

	var body = document.body;

	// if (action == 'parse' && body.hasAttribute(statusLabel) && body.getAttribute(statusLabel) != 'configured') {
	// 	// parsing is already in process or done
	// 	return null;
	// }
	// if (action == 're-parse' && (!body.hasAttribute(statusLabel) || (body.getAttribute(statusLabel) != "complete" && body.getAttribute(statusLabel) != "configured"))) {
	// 	// parsing is not yet started or is in process
	// 	return null;
	// }

	// if (action == 'undo' && !body.hasAttribute(statusLabel)) {
	// 	// parsing is not yet started
	// 	return null;
	// }

    // if (action == 'reset') {
    //     if (body.hasAttribute(statusLabel)) {
	// 		body.removeAttribute(statusLabel);
	// 	}
    //     return null;
    // }
    
	//body.setAttribute(statusLabel, action == 'undo' ? "in-undo" : "in-process");

	return {
        isValid: function (action) {
	        if (action == 'parse' && body.hasAttribute(statusLabel) && body.getAttribute(statusLabel) != 'configured') {
		        // parsing is already in process or done
		        return false;
            }
	        if (action == 're-parse' && (!body.hasAttribute(statusLabel) || (body.getAttribute(statusLabel) != "complete" && body.getAttribute(statusLabel) != "configured"))) {
		        // parsing is not yet started or is in process
		        return false;
	        }
            
	        if (action == 'undo' && !body.hasAttribute(statusLabel)) {
		        // parsing is not yet started
		        return false;
	        }

            return true;
        },
        
        process: function () {
            body.setAttribute(statusLabel, "in-process");
        }, 
		inProcess: function () {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) == "in-process";
		},

		configured: function () {
			body.setAttribute(statusLabel, "configured");
		},
		isConfigured: function () {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) == "configured";
		},
        
		complete: function () {
			body.setAttribute(statusLabel, "complete");
		},
		isComplete:  function() {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) == "complete";
		},

        undo: function () {
			body.setAttribute(statusLabel, "in-undo");
        },
        
		reset: function () {
			if (body.hasAttribute(statusLabel)) {
				body.removeAttribute(statusLabel);
			}
		}
	};
}
