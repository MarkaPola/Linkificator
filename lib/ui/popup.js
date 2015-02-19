
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// popup.js - Linkificator's module
// author: MarkaPola


//
// Manage Chrome UI elements
//

"use strict";

const {Cu} = require('chrome');
const {Services} = Cu.import('resource://gre/modules/Services.jsm');


exports.display = function (id, xul, parameters) {
	let settingsWindow = Services.wm.getMostRecentWindow(id);
	if (settingsWindow) {
		settingsWindow.focus();
	} else {
		parameters.wrappedJSObject = parameters;

		Services.ww.openWindow(null, xul, "_blank", "chrome,centerscreen,dialog=yes,modal=yes,titlebar=yes", parameters);
	}
};

/**
 * Shows an alert message like window.alert() but with a custom title.
 * 
 * @param {Window} parentWindow  parent window of the dialog (can be null)
 * @param {String} title  dialog title
 * @param {String} message  message to be displayed
 */
exports.alert = function (parentWindow, title, message) {
	if (!title)
		title = "Linkificator";
	Services.prompt.alert(parentWindow, title, message);
};

/**
 * Shows a dialog message with OK and Cancel buttons.
 * 
 * @param {Window} parentWindow  parent window of the dialog (can be null)
 * @param {String} title  dialog title
 * @param {String} message  message to be displayed
 */
exports.confirm = function (parentWindow, title, message) {
	if (!title)
		title = "Linkificator";
	return Services.prompt.confirm(parentWindow, title, message);
};
