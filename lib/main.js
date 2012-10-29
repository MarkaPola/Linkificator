
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The main module of the Linkificator Add-on.
// author: MarkaPola


exports.main = function (options) {
	var prefs = require('api-utils/preferences-service');
	var pageMod = require('page-mod');
	var tabs = require('tabs');

	var data = require('self').data;

	// for new installation or upgrade, show an informational page
	if (options.loadReason == 'install' || options.loadReason == 'upgrade') {
		require('timers').setTimeout(function() {
			var addonPage = require('addon-page');
			tabs.open(data.url("welcome/index.html"));
		}, 2000);
	}

    var configurator = require('configurator').Configurator();
    var controler = require('controler').Controler(data, configurator);

	function Context (data) {
		if (data === undefined) {
			this.links = 0;
			this.startTime = Date.now();
		} else {
			this.links = data;
			this.startTime = 0;
		}
	}
	const NotProcessedContext = new Context(-2);

	// workers management
	var workers = [];
	function detachWorker (worker) {
		var index = workers.indexOf(worker);
		if(index != -1) {
			workers.splice(index, 1);
		}
	}

    tabs.on('activate', function (tab) {
		if (!controler.hasValidDocument(tab)) {
			controler.setState(tab, controler.pageNotProcessed);
			return;
		}

        let worker = tab.attach({
            contentScriptFile: [data.url("utilities/statistics.js"), data.url("page.js")]
        });

		worker.port.on('complete',  function (data) {
			controler.setState(tab, data);
		});

		if (configurator.linkifyURL(tab.url)) {
			worker.port.emit('get-stats');
		} else {
			controler.setState(tab, controler.pageExcluded);
		}
    });

	tabs.on('ready', function (tab) {
    	// initialize context for any new tab content
		tab.linkificatorContext = new Context;
	});

	pageMod.PageMod({
        include: ["*", "file://*"],
        attachTo: ["existing", "top", "frame"],
        contentScriptWhen: 'ready',
        contentScriptFile: [data.url("utilities/thread.js"), data.url("utilities/statistics.js"), data.url("linkificator.js")],

        onAttach: function (worker) {
			let tab = worker.tab;

			if (!controler.hasValidDocument(tab)) {
				controler.setState(tab, controler.pageNotProcessed);
				return;
			}

			// store worker to enable re-parsing on add-on re-activation
			workers.push(worker);
			worker.on('detach', function () {
				detachWorker(this);
			});

			if (tab.linkificatorContext === undefined) {
				// can occurred when script is attached to "existing" page
				tab.linkificatorContext = new Context;
			}

            worker.port.on('complete', function (data) {
				tab.linkificatorContext.links = data.links;
				controler.setState(tab, data);
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

			if (controler.isActive()) {
				if (configurator.linkifyURL(tab.url)) {
					worker.port.emit('parse', configurator.properties, tab.linkificatorContext);
				} else {
					controler.setState(tab, controler.pageExcluded);
				}
			} else {
				tab.linkificatorContext = NotProcessedContext;
				controler.setState(tab, controler.pageNotProcessed);
			}
        }
    });

	// to handle statistics on page history browsing
	pageMod.PageMod({
        include: ["*", "file://*"],
        attachTo: ["existing", "top"],
        contentScriptWhen: 'ready',
        contentScriptFile: [data.url("utilities/statistics.js"), data.url("history.js")],

        onAttach: function (worker) {
			let tab = worker.tab;

			if (!controler.hasValidDocument(tab)) {
				controler.setState(tab, controler.pageNotProcessed);
				return;
			}

			worker.port.on('complete',  function (data) {
				controler.setState(tab, data);
			});

            worker.port.on('reset', function () {
				controler.setState(tab, controler.undetermined);
            });

			worker.port.emit('attach');
		}
	});

	// to ensure linkification on add-on reactivation through widget or keyboard shortcut
	controler.on('activate', function () {
		var tabsToProcess = [];
		for each (var tab in tabs) {
			if (tab.linkificatorContext === undefined)
				continue;

			if (tab.linkificatorContext == NotProcessedContext) {
				tabsToProcess.push(tab);
				tab.linkificatorContext = new Context;
			}
		}

		// request parsing for each available worker
		for each (var worker in workers) {
			let tab = worker.tab;

			if (configurator.linkifyURL(tab.url)) {
				if (tabsToProcess.indexOf(tab) != -1) {
					worker.port.emit('parse', configurator.properties, tab.linkificatorContext);
				} else {
					worker.port.emit('get-stats');
				}
			} else {
				controler.setState(tab, controler.pageExcluded);
			}
		}
	});
};

exports.onUnload = function (reason) {
	if (reason == 'disable' || reason == 'uninstall') {
		// reload tabs to get unmodified content
		var tabs = require('tabs');

		for each (var tab in tabs) {
			if (tab.linkificatorContext === undefined)
				continue;
			
			if (tab.linkificatorContext.links != -2) {
				tab.reload();
			}
			delete tab.linkificatorContext;
		}
	}
};
