
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// ui.js - Linkificator's module
// author: MarkaPola


//
// Manage Chrome UI elements
//

function Popup () {
    "use strict";
    
	const {Cu} = require('chrome');
	const {Services} = Cu.import('resource://gre/modules/Services.jsm');

	return {
		display: function (id, xul, parameters) {
			let settingsWindow = Services.wm.getMostRecentWindow(id);
			if (settingsWindow) {
				settingsWindow.focus();
			} else {
				parameters.wrappedJSObject = parameters;

				Services.ww.openWindow(null, xul, "_blank", "chrome,centerscreen,dialog=yes,modal=yes,titlebar=yes", parameters);
			}
		},

        /**
	     * Shows an alert message like window.alert() but with a custom title.
	     * 
	     * @param {Window} parentWindow  parent window of the dialog (can be null)
	     * @param {String} title  dialog title
	     * @param {String} message  message to be displayed
	     */
	    alert: function (parentWindow, title, message) {
		    if (!title)
			    title = "Linkificator";
		    Services.prompt.alert(parentWindow, title, message);
	    }
	};
}

exports.Popup = Popup;
