

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* widget mouse clicks and image handling - Linkificator's module
 * author: MarkaPola */

this.addEventListener('click', function(event) {
	if (event.button == 1 || (event.button == 0 && event.altKey == true)) {
		self.port.emit('middleclick');
		event.stopPropagation();
		event.preventDefault();
	}
	if (event.button == 2 || (event.button == 0 && event.shiftKey == true)) {
		self.port.emit('rightclick');
		event.stopPropagation();
		event.preventDefault();
	}
}, true);

self.port.on('icon', function (icon) {
    if (icon === 'linkificator-on')
	    document.getElementById("widget-image").setAttribute("src", "../resources/link-on.png");
    else if (icon === 'linkificator-manual')
	    document.getElementById("widget-image").setAttribute("src", "../resources/link-manual.png");
    else if (icon === 'linkificator-off')
	    document.getElementById("widget-image").setAttribute("src", "../resources/link-off.png");
    else if (icon === 'linkificator-excluded')
	    document.getElementById("widget-image").setAttribute("src", "../resources/link-excluded.png");
});
