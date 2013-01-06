

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* widget mouse clicks and image handling - Linkificator's module
 * author: MarkaPola */

this.addEventListener('click', function(event) {
	if (event.button == 1 || (event.button == 0 && event.altKey == true)) {
		self.port.emit('middle-click');
		event.preventDefault();
	}
	if (event.button == 2 || (event.button == 0 && event.shiftKey == true)) {
		self.port.emit('right-click');
		event.preventDefault();
	}
}, true);

self.port.on('on', function () {
	 document.getElementById("widget-image").setAttribute("src", "link-on.png");
});
self.port.on('off', function () {
	 document.getElementById("widget-image").setAttribute("src", "link-off.png");
});
self.port.on('excluded', function () {
	 document.getElementById("widget-image").setAttribute("src", "link-excluded.png");
});
