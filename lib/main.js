
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
			tabs.open(data.url("welcome/release-notes.html"));
		}, 2000);

        let version = require('sdk/system').version;
        if (version.indexOf('20.') == 0) {
            let windows = require('sdk/windows');
            let _ = require('sdk/l10n').get;

            require('./ui').Popup().alert(windows.browserWindows.activeWindow,
                                          _('alert.title'),
                                          _('alert.message'));
        }
	}
    
    var configurator = require('./configurator').Configurator();
    var controler = require('./controler').Controler(configurator);
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
	workers.detach = function (worker) {
		var index = this.indexOf(worker);
		if(index != -1) {
			this.splice(index, 1);
		}
	};

	// process current tab
	function process (action, tab) {
		workers.apply(tab, function (worker) {
			worker.port.emit(action, configurator.properties);
		});
	}

    tabs.on('activate', function (tab) {
		controler.setStatus(tab);

	 	// re-launch valid action
	 	if (controler.isValidDocument(tab) && controler.linkifyURL(tab.url)) {
	 		process(controler.isActive() ? 'parse' : 'undo', tab);
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

            worker.port.on('pageshow', function () {
				controler.setStatus(tab);

				if (controler.isValidDocument(tab) && controler.linkifyURL(tab.url)) {
					process(controler.isActive() ? 'parse' : 'undo', tab);
				}
			});

			worker.port.emit('attach');
		}
	});

	// parsing of all frames
	pageMod.PageMod({
        include: ["*", "file://*"],
        attachTo: ["existing", "top", "frame"],
        contentScriptWhen: 'end',
        contentScriptFile: [data.url("utilities/thread.js"), data.url("statistics.js"),
							data.url("state.js"), data.url("linkificator.js")],

        onAttach: function (worker) {
			let tab = worker.tab;

			controler.setStatus(tab);

			if (!controler.isValidDocument(tab)) {
				return;
			}

			// store worker to enable to retrieve statistics and re-parsing on add-on re-activation
			workers.push(worker);
			worker.on('detach', function () {
				workers.detach(this);
			});

            worker.port.on('statistics', function (data) {
				let statistics = tab.linkificatorStatistics;

				statistics.links += data.links;
				statistics.time = Math.max(statistics.time, data.time);
				controler.setStatistics(tab, statistics);
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

			if (controler.isActive() && controler.linkifyURL(tab.url)) {
					worker.port.emit('parse', configurator.properties);
			}
        }
    });

	// compute statistics
	controler.on('statistics', function () {
		let tab = tabs.activeTab;

		if (controler.isValidDocument(tab) && controler.linkifyURL(tab.url)) {
			tab.linkificatorStatistics = new Statistics;

			workers.apply(tab, function (worker) {
				worker.port.emit('get-statistics');
			});
		}
	});

	// to re-parse current tab on user's request
	controler.on('re-parse', function (tab) {
		process('re-parse', tab);
	});
	// to ensure linkification on add-on reactivation through widget or keyboard shortcut
	// or inclusion of prviously excluded url
	controler.on('activate', function (tab) {
		process('parse', tab);
	});
	// to revert all linkificator changes
	controler.on('undo', function (tab) {
		process('undo', tab);
	});
};

exports.onUnload = function (reason) {
	if (reason == 'disable' || reason == 'uninstall') {
		if (Context.controler) {
			// reload tabs to get unmodified content
			var tabs = require('sdk/tabs');
			var controler = Context.controler;

			for each (let tab in tabs) {
				if (controler.isValidDocument(tab)) {
					tab.reload();
				}
			}
		}
	}
};
