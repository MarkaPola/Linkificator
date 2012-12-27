
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The main module of the Linkificator Add-on.
// author: MarkaPola

var Context = {};

exports.main = function (options) {
	var prefs = require('sdk/preferences/service');
	var pageMod = require('sdk/page-mod');
	var tabs = require('sdk/tabs');

	var data = require('sdk/self').data;

	// for new installation or upgrade, show an informational page
	if (options.loadReason == 'install' || options.loadReason == 'upgrade') {
		require('sdk/timers').setTimeout(function() {
			var addonPage = require('sdk/addon-page');
			tabs.open(data.url("index.html"));
		}, 2000);
	}

    var configurator = require('configurator').Configurator();
    var controler = require('controler').Controler(data, configurator);
	Context = {configurator: configurator, controler: controler};

	function Statistics () {
		this.links = 0;
		this.time = 0;
	}

	// workers management
	var workers = [];
	workers.apply = function (tab, action) {
		this.forEach (function (worker, index, array) {
			if (worker.tab === tab) {
				try {
					action (worker, index, array);
				} catch (e) {
					// exception could be raised if history is used because
					// some workers are attached to a hidden page, so ERR_FROZEN is raised
				}
			}
		});
	};

	function detachWorker (worker) {
		var index = workers.indexOf(worker);
		if(index != -1) {
			workers.splice(index, 1);
		}
	}
	// parse current tab
	function parse (tab) {
		workers.apply(tab, function (worker) {
			worker.port.emit('parse', configurator.properties);
		});
	}

    tabs.on('activate', function (tab) {
		if (!controler.hasValidDocument(tab)) {
			controler.setState(tab, controler.pageNotProcessed);
		} else if (configurator.linkifyURL(tab.url)) {
			controler.setState(tab, controler.pageProcessed);
		} else {
			controler.setState(tab, controler.pageExcluded);
		}
    });

	// to handle page history browsing
	pageMod.PageMod({
        include: ["*", "file://*"],
        attachTo: ["existing", "top"],
        contentScriptWhen: 'start',
        contentScriptFile: data.url("history.js"),

        onAttach: function (worker) {
			let tab = worker.tab;

            worker.port.on('to-page', function () {
				if (!controler.hasValidDocument(tab)) {
					controler.setState(tab, controler.pageNotProcessed);
				} else if (controler.isActive()) {
					if (configurator.linkifyURL(tab.url)) {
						parse(tab);
						controler.setState(tab, controler.pageProcessed);
					} else {
						controler.setState(tab, controler.pageExcluded);
					}
				} else {
					controler.setState(tab, controler.pageExcluded);
				}
            });

            worker.port.on('from-page', function () {
				controler.setState(tab, controler.undetermined);
            });

			worker.port.emit('attach');
		}
	});

	// parsing of all frames
	pageMod.PageMod({
        include: ["*", "file://*"],
        attachTo: ["existing", "top", "frame"],
        contentScriptWhen: 'end',
        contentScriptFile: [data.url("utilities/thread.js"), data.url("utilities/statistics.js"), data.url("linkificator.js")],

        onAttach: function (worker) {
			let tab = worker.tab;

			if (!controler.hasValidDocument(tab)) {
				controler.setState(tab, controler.pageNotProcessed);
				return;
			}

			// store worker to enable to retrieve statistics and re-parsing on add-on re-activation
			workers.push(worker);
			worker.on('detach', function () {
				detachWorker(this);
			});

            worker.port.on('statistics', function (data) {
				let statistics = tab.linkificatorStatistics;

				statistics.links += data.links;
				statistics.time = Math.max(statistics.time, data.time);
				controler.setState(tab, statistics);
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
					worker.port.emit('parse', configurator.properties);
					controler.setState(tab, controler.pageProcessed);
				} else {
					controler.setState(tab, controler.pageExcluded);
				}
			} else {
				controler.setState(tab, controler.pageNotProcessed);
			}
        }
    });

	// compute statistics
	controler.on('statistics', function () {
		let tab = tabs.activeTab;

		if (controler.hasValidDocument(tab) && configurator.linkifyURL(tab.url)) {
			tab.linkificatorStatistics = new Statistics;

			workers.apply(tab, function (worker) {
				worker.port.emit('get-statistics');
			});
		}
	});

	// to ensure linkification on add-on reactivation through widget or keyboard shortcut
	controler.on('activate', function () {
		let tab = tabs.activeTab;

		if (!controler.hasValidDocument(tab)) {
			controler.setState(tab, controler.pageNotProcessed);
		} else if (configurator.linkifyURL(tab.url)) {
			parse(tab);
			controler.setState(tab, controler.pageProcessed);
		} else {
			controler.setState(tab, controler.pageExcluded);
		}
	});
};

exports.onUnload = function (reason) {
	if (reason == 'disable' || reason == 'uninstall') {
		if (Context.controler) {
			// reload tabs to get unmodified content
			var tabs = require('sdk/tabs');
			var controler = Context.controler;

			for each (let tab in tabs) {
				if (controler.hasValidDocument(tab)) {
					tab.reload();
				}
			}
		}
	}
};
