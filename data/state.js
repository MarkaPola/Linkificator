
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* state parsing management - Linkificator's module
 * author: MarkaPola */

function State (document, action) {

	const statusLabel = "linkificator-status";

	var body = document.body;

	if (action == 'parse' && body.hasAttribute(statusLabel)) {
		// parsing is already in process or done
		return null;
	}
	if (action == 're-parse' && (!body.hasAttribute(statusLabel) || body.getAttribute(statusLabel) != "complete")) {
		// parsing is not yet started or is in process
		return null;
	}

	body.setAttribute(statusLabel, "in-process");

	return {
		inProcess: function() {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) == "in-process";
		},

		complete: function () {
			document.body.setAttribute(statusLabel, "complete");
		},
		isComplete:  function() {
			return body.hasAttribute(statusLabel)
				&& body.getAttribute(statusLabel) == "complete";
		}
	}
}
