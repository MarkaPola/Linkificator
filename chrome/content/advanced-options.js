
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Advanced options management - Linkificator's module
 * author: MarkaPola */

var AdvancedSettings = (function() {
	var properties = null;

	var protocols = null;
	var subdomains = null;
	var excludedElements = null;

	var changed = {};

	return {
		init: function () {
			properties = window.arguments[0].wrappedJSObject;
			protocols = document.getElementById('advanced-settings.protocol-list');
			subdomains = document.getElementById('advanced-settings.subdomain-list');
			excludedElements = document.getElementById('advanced-settings.excludedElement-list');

			// attach default values to nodes
			let defaults = properties.defaults;
			protocols.setAttribute ('value', defaults.protocols);
			subdomains.setAttribute ('value', defaults.subdomains);
			excludedElements.setAttribute ('value', defaults.excludedElements);

			// set actual values
			protocols.value = properties.protocols;
			subdomains.value = properties.subdomains;
			excludedElements.value = properties.excludedElements;
		},

		validate: function () {
			// add changed values
			properties.changed = changed;
		},

		change: function (type) {
			switch (type) {
				case 'protocols':
				changed.protocols = protocols.value;
				break;
				case 'subdomains':
				changed.subdomains = subdomains.value;
				break;
				case 'excludedElements':
				changed.excludedElements = excludedElements.value;
				break;
			}
		},

		reset: function (type) {
			switch (type) {
				case 'protocols':
				protocols.reset();
				changed.protocols = properties.defaults.protocols;
				break;
				case 'subdomains':
				subdomains.reset();
				changed.subdomains = properties.defaults.subdomains;
				break;
				case 'excludedElements':
				excludedElements.reset();
				changed.excludedElements = properties.defaults.excludedElements;
				break;
			}
		}
	};
})();

