

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* panel state and mouse clicks handling - Linkificator's module
 * author: MarkaPola */

var entries = {
    options: document.getElementById("linkificator-options"), 
    toggle: document.getElementById("linkificator-toggle"), 
    manage: document.getElementById("linkificator-manage"), 
    linkify: document.getElementById("linkificator-linkify")
};

var isActive = true;
var l10n = null;

// Reset stored coordinates to avoid hover style on panel show
function reset (event) {
	let element = event.target;
	element.mouseX = undefined;
	element.mouseY = undefined;
}

entries.options.addEventListener('click', function(event) {
	self.port.emit('options');
	event.preventDefault();
	reset(event);
}, true);

entries.toggle.addEventListener('click', function(event) {
	self.port.emit('toggle');
	event.preventDefault();
	reset(event);
}, true);

entries.manage.addEventListener('click', function(event) {
	self.port.emit('manage');
	event.preventDefault();
	reset(event);
}, true);

entries.linkify.addEventListener('click', function(event) {
    if (entries.linkify.getAttribute("class") === "linkificator-active")
	    self.port.emit('linkify');
	event.preventDefault();
	reset(event);
}, true);


self.port.on('initialize', function (data) {
	l10n = data;

	entries.options.textContent = l10n.options;
	entries.toggle.textContent = l10n.disable;
	entries.manage.textContent = l10n.exclude;
	entries.linkify.textContent = l10n.linkify;
});

self.port.on('configure', function (config) {
	isActive = config.active;

	entries.toggle.textContent = isActive ? l10n.disable : l10n.enable;
	entries.manage.textContent = config.status == 'excluded' ? l10n.include : l10n.exclude;
	entries.manage.setAttribute("class", config.status == 'excluded' || config.status == 'processed' ? "linkificator-active" : "linkificator-inactive");
	entries.linkify.setAttribute("class", config.status == 'processed' ? "linkificator-active" : "linkificator-inactive");
});

self.port.on('label', function (data) {
    entries[data.id].textContent = data.value;
});

self.port.on('disabled', function (data) {
    entries[data.id].setAttribute("class", data.value ? "linkificator-active" : "linkificator-inactive");
});

