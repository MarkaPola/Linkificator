
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The main module of the Linkificator Add-on.
// author: MarkaPola

var Context = {};

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


exports.main = function (options) {
    "use strict";

    var prefs = require('sdk/preferences/service');
	var pageMod = require('sdk/page-mod');
	var tabs = require('sdk/tabs');

	var data = require('sdk/self').data;

	// for new installation or upgrade, show an informational page
	if (options.loadReason == 'install' || options.loadReason == 'upgrade') {
		require('sdk/timers').setTimeout(function() {
            tabs.open("chrome://linkificator/content/release-notes.xhtml");
		}, 2000);
	}
    
    var configurator = require('./configurator').Configurator();
    var controler = require('./controler').Controler(configurator);
	Context = {configurator: configurator, controler: controler};

	function Statistics () {
		this.links = 0;
		this.time = 0;
	}

	// process specified tab
	function process (action, tab) {
        workers.apply(tab, function (worker) {
            let properties = configurator.properties;
            if (tab.contentType) {
                properties.document = {contentType: tab.contentType};
            } else {
                properties.document = {contentType: null};
            }
            
			worker.port.emit(action, properties);
		});
	}

    tabs.on('activate', function (tab) {
        let processTab = function(tab) {
            tab.removeListener('ready', processTab);
            
            controler.setStatus(tab);

	 	    // re-launch valid action
            if (controler.isValidDocument(tab) && controler.linkifyURL(tab)) {
	 		    process(controler.isActive() ? 'parse' : 'undo', tab);
	 	    }
        };

        let worker = tab.attach({contentScript: "self.port.emit ('readyState', document.readyState && (document.readyState == 'interactive' || document.readyState == 'complete'));"});

        worker.port.on('readyState', function(ready) {
            if (ready) {
                processTab(tab);
            } else {
                tab.on('ready', processTab);
            }
        });
    });
    tabs.on('ready', function (tab) {
        controler.setStatus(tab);
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

				if (controler.isValidDocument(tab) && controler.linkifyURL(tab)) {
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
        contentScriptFile: [data.url("utilities/thread.js"), data.url("utilities/document.js"),
                            data.url("statistics.js"), data.url("state.js"),
                            data.url("linkificator.js")],

        onAttach: function (worker) {
			let tab = worker.tab;

            if (!tab) {
                // not content script attached to worker
                return;
            }
            
            let properties = configurator.properties;

            if (tab.contentType) {
                properties.document = {contentType: tab.contentType};
                tab.linkificator = {contentType: tab.contentType, statistics: null};
            } else {
                properties.document = {contentType: null};
                tab.linkificator = {contentType: 'text/html', statistics: null};
            }
            
			controler.setStatus(tab);

			if (!controler.isValidDocument(tab)) {
				return;
			}

			// store worker to enable to retrieve statistics and re-parsing on add-on re-activation
			workers.push(worker);
			worker.on('detach', function () {
				workers.detach(this);
			});

            worker.port.on('content-type', function (data) {
                tab.linkificator.contentType = data;
                properties.document.contentType = data;
                                       
                controler.setStatus(tab);
            });
            
            worker.port.on('document-changed', function () {
                if (workers.indexOf(worker) !== -1) {
                    controler.setStatus(tab);
                    worker.port.emit(controler.linkifyURL(tab) ? 're-parse' : 'undo', properties);
                }
            });
            
            worker.port.on('statistics', function (data) {
				let statistics = tab.linkificator.statistics;

				statistics.links += data.links;
				statistics.time = Math.max(statistics.time, data.time);
				controler.setStatistics(tab, statistics);
            });

			worker.port.on('open-url', function (action) {
				if (action.button === 'left') {
					tabs.activeTab.url = action.url;
				} else {
					tabs.open({
						url: action.url,
						inBackground: prefs.get('browser.tabs.loadInBackground', false)
					});
				}
			});

			if (controler.isActive() && controler.linkifyURL(tab)) {
				worker.port.emit('initial-parse', properties);
			}
        }
    });

	// compute statistics
	controler.on('statistics', function (tab) {
		if (controler.isValidDocument(tab) && controler.linkifyURL(tab)) {
            tab.linkificator.statistics = new Statistics;
            
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
	// or inclusion of previously excluded url
	controler.on('activate', function (tab) {
		process('parse', tab);
	});
	// to revert all linkificator changes
	controler.on('undo', function (tab) {
		process('undo', tab);
	});
};

exports.onUnload = function (reason) {
    "use strict";
    
	if (reason == 'disable' || reason == 'uninstall') {
        // reload tabs to get unmodified content                                  
        let tabs = [];                                                                   
        
        for (let worker of workers) {                                                    
            if (tabs.indexOf(worker.tab) == -1)                                          
                tabs.push(worker.tab);                                                   
        }                                                                                
        
        for (let tab of tabs) {                                                          
            tab.reload();                                                                
        }
    }
};
