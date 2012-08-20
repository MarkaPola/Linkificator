
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Advanced options management - Linkificator's module
 * author: MarkaPola */

var AdvancedSettings = (function() {
	var properties = null;

	var supportEmail = null;
	var supportAbout = null;

	var protocols = null;
	var subdomains = null;
	var excludedElements = null;

	var changed = {support: {}, configuration: {} };

	return {
		init: function () {
			properties = window.arguments[0].wrappedJSObject;

			supportEmail = document.getElementById('advanced-settings.link-type.email');
			supportAbout = document.getElementById('advanced-settings.link-type.about');

			protocols = document.getElementById('advanced-settings.protocol.list');
			subdomains = document.getElementById('advanced-settings.subdomain.list');
			excludedElements = document.getElementById('advanced-settings.excludedElement.list');

			// attach default values to nodes
			let defaults = properties.configuration.defaults;
			protocols.setAttribute ('value', defaults.protocols);
			subdomains.setAttribute ('value', defaults.subdomains);
			excludedElements.setAttribute ('value', defaults.excludedElements);

			// set actual values
			supportEmail.checked = properties.support.email;
			supportAbout.checked = properties.support.about;

			protocols.value = properties.configuration.protocols;
			subdomains.value = properties.configuration.subdomains;
			excludedElements.value = properties.configuration.excludedElements;
		},

		validate: function () {
			// add changed values
			properties.changed = changed;
			properties.changed.support.email = supportEmail.checked;
			properties.changed.support.about = supportAbout.checked;
		},

		change: function (type) {
			switch (type) {
				case 'protocols':
				changed.configuration.protocols = protocols.value;
				break;
				case 'subdomains':
				changed.configuration.subdomains = subdomains.value;
				break;
				case 'excludedElements':
				changed.configuration.excludedElements = excludedElements.value;
				break;
			}
		},

		reset: function (type) {
			switch (type) {
				case 'protocols':
				protocols.reset();
				changed.configuration.protocols = properties.configuration.defaults.protocols;
				break;
				case 'subdomains':
				subdomains.reset();
				changed.configuration.subdomains = properties.configuration.defaults.subdomains;
				break;
				case 'excludedElements':
				excludedElements.reset();
				changed.configuration.excludedElements = properties.configuration.defaults.excludedElements;
				break;
			}
		}
	};
})();

