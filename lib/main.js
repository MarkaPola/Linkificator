
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
		this.worker = data === undefined ? null : data;
		this.links = 0;
		this.startTime = Date.now();
	}
	Context.prototype.reset = function () {
		this.links = 0;
		this.startTime = Date.now();
	}
	Context.prototype.notProcessed = function () {
		this.links = -2;
	};
	Context.prototype.isProcessed = function () {
		return this.links != -2;
	};

	function Statistics (context) {
		this.links = context.links;
		this.time = Date.now()-context.startTime;
	}

	// workers management
	var workers = [];
	function detachWorker (worker) {
		var index = workers.indexOf(worker);
		if(index != -1) {
			workers.splice(index, 1);
		}
	}
	// parse current tab
	function parse (tab) {
		if (tab.linkificatorContext && !tab.linkificatorContext.isProcessed()) {
			tab.linkificatorContext.reset();
			for each (let worker in workers) {
				if (worker.tab === tab) {
					try {
						worker.port.emit('parse', configurator.properties);
					} catch (e) {
						// exception could be raised if history is used because
						// some workers are attached to a hidden page, so ERR_FROZEN is raised
					}
				}
			}

			return true;
		}
		
		return false;
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
			if (controler.isActive()) {
				parse(tab);
			}
			worker.port.emit('get-stats');
		} else {
			controler.setState(tab, controler.pageExcluded);
		}
    });

	// to handle statistics and page history browsing
	pageMod.PageMod({
        include: ["*", "file://*"],
        attachTo: ["existing", "top"],
        contentScriptWhen: 'ready',
        contentScriptFile: [data.url("utilities/statistics.js"), data.url("page.js"), data.url("history.js")],

        onAttach: function (worker) {
			let tab = worker.tab;

			if (!controler.hasValidDocument(tab)) {
				controler.setState(tab, controler.pageNotProcessed);
				return;
			}

			tab.linkificatorContext = new Context(worker);

			worker.port.on('complete', function (data) {
				controler.setState(tab, data);
			});

            worker.port.on('to-page', (function (data) {
				tab.linkificatorContext.worker = this;
				if (configurator.linkifyURL(tab.url)) {
					controler.setState(tab, data);
					tab.linkificatorContext.links = data.links;
					if (controler.isActive()) {
						parse(tab);
					}
				} else {
					controler.setState(tab, controler.pageExcluded);
				}
            }).bind(worker));

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

			// store worker to enable re-parsing on add-on re-activation
			workers.push(worker);
			worker.on('detach', function () {
				detachWorker(this);
			});

            worker.port.on('complete', function (count) {
				tab.linkificatorContext.links += count;
				let stats = new Statistics(tab.linkificatorContext);
				tab.linkificatorContext.worker.port.emit('set-stats', stats);
				controler.setState(tab, stats);
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
				} else {
					controler.setState(tab, controler.pageExcluded);
				}
			} else {
				tab.linkificatorContext.notProcessed();
				controler.setState(tab, controler.pageNotProcessed);
			}
        }
    });

	// to ensure linkification on add-on reactivation through widget or keyboard shortcut
	controler.on('activate', function () {
		let tab = tabs.activeTab;

		if (tab.linkificatorContext === undefined)
			return;

		if (configurator.linkifyURL(tab.url)) {
			if (!parse(tab)) {
				try {
					tab.linkificatorContext.worker.port.emit('get-stats');
				} catch (e) {
					// exception ERR_FROZEN could be raised if history and de-activation/activation
					// are used in conjunction.
				}
			}
		} else {
			controler.setState(tab, controler.pageExcluded);
		}
	});
};

exports.onUnload = function (reason) {
	if (reason == 'disable' || reason == 'uninstall') {
		// reload tabs to get unmodified content
		var tabs = require('tabs');

		for each (let tab in tabs) {
			if (tab.linkificatorContext === undefined)
				continue;
			
			if (tab.linkificatorContext.links != -2) {
				tab.reload();
			}
			delete tab.linkificatorContext;
		}
	}
};
