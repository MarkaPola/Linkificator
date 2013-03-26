

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* panel state and mouse clicks handling - Linkificator's module
 * author: MarkaPola */

self.on("context", function (node) {
	return document.querySelector("body[linkificator-status='complete']") != null;
});

self.on('click', function (node, data) {
	self.postMessage(data);
});
