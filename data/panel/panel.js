

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* panel state and mouse clicks handling - Linkificator's module
 * author: MarkaPola */

var options = document.getElementById("linkificator-options");
var toggle = document.getElementById("linkificator-toggle");
var filter = document.getElementById("linkificator-filter");
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

filter.addEventListener('click', function(event) {
	self.port.emit('filter');
	event.preventDefault();
}, true);

linkify.addEventListener('click', function(event) {
	if (isActive) {
		self.port.emit('re-parse');
	}
	event.preventDefault();
	reset(event);
}, true);


self.port.on('initialize', function (data) {
	l10n = data;

	options.textContent = l10n.options;
	toggle.textContent = l10n.disable;
	filter.textContent = l10n.exclude;
	linkify.textContent = l10n.linkify;
});

self.port.on('configure', function (config) {
	isActive = config.active;

	toggle.textContent = isActive ? l10n.disable : l10n.enable;
	filter.textContent = config.status == 'filtered' ? l10n.include : l10n.exclude;
	filter.setAttribute("class", config.status == 'filtered' || config.status == 'processed' ? "linkificator-active" : "linkificator-inactive");
	linkify.setAttribute("class", config.status == 'processed' ? "linkificator-active" : "linkificator-inactive");
});

