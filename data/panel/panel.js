

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* panel state and mouse clicks handling - Linkificator's module
 * author: MarkaPola */

var options = document.getElementById("linkificator-options");
var toggle = document.getElementById("linkificator-toggle");
var linkify = document.getElementById("linkificator-linkify");

var isActive = true;
var l10n = null;

// Reset stored coordinates to avoid hover style on panel show
function reset (event) {
	let element = event.target;
	element.mouseX = undefined;
	element.mouseY = undefined;
}

options.addEventListener('click', function(event) {
	self.port.emit('options');
	
	event.preventDefault();
	reset(event);
}, true);

toggle.addEventListener('click', function(event) {
	self.port.emit('toggle');
	event.preventDefault();
}, true);

linkify.addEventListener('click', function(event) {
	if (isActive) {
		self.port.emit('re-parse');
	}
	event.preventDefault();
	reset(event);
}, true);


self.port.on('initialize', function(data) {
	l10n = data;

	options.innerHTML = l10n.options;
	toggle.innerHTML = l10n.disable;
	linkify.innerHTML = l10n.linkify;
});

self.port.on('configure', function (config) {
	isActive = config.active;

	toggle.innerHTML = isActive ? l10n.disable : l10n.enable;
	linkify.setAttribute("class", config.status == 'processed' ? "linkificator-active" : "linkificator-inactive");
});

