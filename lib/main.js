
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The main module of the Linkificator Add-on.
// author: MarkaPola


exports.main = function() {
	var tabs = require('tabs');

	var data = require('self').data;

    var configurator = require('configurator').Configurator();
    var controler = require('controler').Controler(data, configurator);

    tabs.on('activate', function (tab) {
        tab.attach({
            contentScriptFile: [data.url("utilities/statistics.js"), data.url("page.js")],
            onMessage: function (data) {
				if (controler.isActive() && configurator.linkifyURL(tab.url))
					controler.setState(tab, data);
				else
					controler.setState(tab, {links: -1});
            }
        });
    });
    
	tabs.on('ready', function(tab) {
		let worker = tab.attach({
			contentScriptFile: [data.url("utilities/thread.js"), data.url("utilities/statistics.js"), data.url("linkificator.js")],
			onMessage: function (data) {
				if (controler.isActive() && configurator.linkifyURL(tab.url))
					controler.setState(tab, data);
				else
					controler.setState(tab, {links: -1});
            }
		});

		worker.port.on('open-url', function (action) {
			if (action.button == 'left') {
				tabs.activeTab.url = action.url;
			} else {
				tabs.open ({
					url: action.url,
					inBackground: prefs.get('browser.tabs.loadInBackground', false)
				});
			}
		});

		if (controler.isActive() && configurator.linkifyURL(tab.url))
			worker.postMessage(configurator.properties);
		else
			controler.setState(tab, {links: -1});
	});
}
