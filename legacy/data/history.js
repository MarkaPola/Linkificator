
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* tab history handling - Linkificator's module
 * author: MarkaPola */

// catch backward/forward button events to handle widget update
function toPage (event) {
	if (event.persisted) {
		self.port.emit('pageshow');
	}
}

self.port.on('attach', function () {
	window.top.addEventListener('pageshow', toPage, false);
});
