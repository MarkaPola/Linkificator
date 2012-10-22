
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The main module of the Linkificator Add-on.
// author: MarkaPola


exports.main = function() {
	var prefs = require("api-utils/preferences-service");
	var pageMod = require('page-mod');
	var tabs = require('tabs');

	var data = require('self').data;

    var configurator = require('configurator').Configurator();
    var controler = require('controler').Controler(data, configurator);

    tabs.on('activate', function (tab) {
		if (tab.contentType != 'text/html' && tab.contentType != 'text/plain') {
			controler.setState(tab, controler.pageNotProcessed);
			return;
		}

        let worker = tab.attach({
            contentScriptFile: [data.url("utilities/statistics.js"), data.url("page.js")]
        });

		worker.port.on('complete',  function (data) {
			if (controler.isActive() && configurator.linkifyURL(tab.url)) {
				controler.setState(tab, data);
			} else {
				controler.setState(tab, controler.pageExcluded);
			}
        });
    });

	tabs.on('ready', function (tab) {
    	// initialize context for any new tab content
		tab.linkificatorContext = {links: 0, startTime: Date.now()};
	});

	pageMod.PageMod({
        include: ["*", "file://*"],
        attachTo: ["existing", "top", "frame"],
        contentScriptWhen: 'ready',
        contentScriptFile: [data.url("utilities/thread.js"), data.url("utilities/statistics.js"), data.url("linkificator.js")],

        onAttach: function (worker) {
			let tab = worker.tab;

			if (tab.contentType != 'text/html' && tab.contentType != 'text/plain') {
				controler.setState(tab, controler.pageNotProcessed);
				return;
			}

			if (tab.linkificatorContext === undefined) {
				// can occurred when script is attached to "existing" page
				tab.linkificatorContext = {links: 0, startTime: Date.now()};
			}

            worker.port.on('complete', function (data) {
				if (controler.isActive() && configurator.linkifyURL(tab.url)) {
					tab.linkificatorContext.links = data.links;
					controler.setState(tab, data);
				} else {
					controler.setState(tab, controler.pageExcluded);
				}
            });

			worker.port.on('open-url', function (action) {
				if (action.button == 'left') {
					tabs.activeTab.url = action.url;
				} else {
					tabs.open({
						url: action.url,
						inBackground: prefs.get('browser.tabs.loadInBackground', false)
					});
				}
			});

			if (controler.isActive() && configurator.linkifyURL(tab.url)) {
				worker.port.emit('parse', configurator.properties, tab.linkificatorContext);
			} else {
				controler.setState(tab, controler.pageExcluded);
			}
        }
    });
}
