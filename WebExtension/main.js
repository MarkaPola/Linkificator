
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// The main module of the Linkificator Add-on.
// author: MarkaPola



Configurator().then (properties => {


	function Statistics () {
		this.links = 0;
		this.time = 0;
	}


    class Worker {
        constructor (port, tab) {
            this._port = port;
            this._tab = tab;
            this._contentType = null;
            this._statistics = new Statistics();
        }

        get tab () {
            return this._tab;
        }
        
        get contentType () {
            return this._contentType;
        }
        set contentType (contentType) {
            return this._contentType = contentType;
        }
        
        get isValidDocument () {
            if (!this._contentType)
                return false;
        
		    return this._contentType.startsWith('text/html') || this._contentType.startsWith('text/plain')
			      || this._contentType.startsWith('application/xhtml');
        }

        sendMessage (message) {
            this._port.postMessage(message);
        }
        
        get statistics () {
            return this._statistics;
        }
        set statistics (stats) {
            this._statistics = stats;
        }
    }
    
    class Workers extends Map {
        constructor () {
            super();
        }

        *getTabs (query) {
            let set = new Set();
            if (query === undefined) query = {validOnly: false};
            
            for (const worker of this.values()) {
                if (!set.has(worker.tab)) {
                    if (!query.validOnly || worker.isValidDocument) {
                        set.add(worker.tab);
                        yield worker.tab;
                    }
                }
            }
        }
        
        *forTab (tab) {
            for (const worker of this.values()) {
                if (tab.id == worker.tab.id)
                    yield worker;
            };
        }
        
        isValidTab (tab) {
            if (!controler.linkifyURL(tab.url)) return false;
            
            for (const worker of this.forTab(tab)) {
                if (worker.isValidDocument) {
                    return true;
                }
            }

            return false;
        }
        
        getStatistics (tab) {
            let statistics = new Statistics();

            for (const worker of this.forTab(tab)) {
                statistics.links += worker.statistics.links;
			    statistics.time = Math.max(statistics.time, worker.statistics.time);
            };

            return statistics;
        }
    }
    
    var workers = new Workers();

    var controler = Controler(properties);

    // handle tabs events
    browser.tabs.onCreated.addListener(tab => controler.setStatus({tab: tab}));
    
    browser.tabs.onActivated.addListener(info => {
        browser.tabs.get(info.tabId).then(tab =>
                                          controler.contextMenu.update({enable: controler.isActive() && workers.isValidTab(tab)}));
    });
    
    browser.tabs.onUpdated.addListener((tabId, info, tab) => {
        if (info.url) {
            let isValid = workers.isValidTab(tab);
            
            controler.setStatus({tab: tab, isValid: isValid});
            
            // update context menu if this is one of the active tabs
            if (controler.isActive() && isValid) {
                controler.contextMenu.update({tabId: tab.id, enable: true});
            }
        }
    });

    // handle content_scripts
    browser.runtime.onConnect.addListener(port => {
        if (port.sender.tab.id === browser.tabs.TAB_ID_NONE) {
            return;
        }

        workers.set(port, new Worker(port, {id: port.sender.tab.id, url: port.sender.tab.url}));

        port.onMessage.addListener(message => {
            let worker = workers.get(port);
            let tab = worker.tab;
            
            switch (message.id) {
            case 'content-type':
                worker.contentType = message.contentType;
                
                controler.setStatus({tab: tab, isValid: workers.isValidTab(tab)});
                
                if (controler.isActive() && controler.linkifyURL(tab) && worker.isValidDocument) {
                    port.postMessage ({id: 'parse'});
                }
                break;
            case 'configured':
                if (controler.isActive() && controler.isManual()) {
                    // update context menu
                    controler.contextMenu.update({tabId: tab.id, enable: true});
                }
                break;
            case 'completed':
                if (controler.isActive() && !controler.isManual()) {
                    // update context menu
                    controler.contextMenu.update({tabId: tab.id, enable: true});
                }
                break;
            case 'statistics':
                worker.statistics = message.statistics;

                if (controler.isActive()) {
                    controler.setStatus({tab: tab,
                                         isValid: true, 
                                         displayTooltip: true, 
                                         displayBadge: properties.displayBadge,
                                         statistics: workers.getStatistics(tab)});
                }
                break;
            }
        });

        port.onDisconnect.addListener(port => {
            workers.delete(port);
        });
    });


    // attach listeners to various events
    controler.onBadgeChanged.addListener(info => {
        if (controler.isActive()) {
            for (const tab of workers.getTabs({validOnly: true})) {
                // recompute links count for every tab
                if (controler.linkifyURL(tab)) {
                    controler.setStatus({tab: tab,
                                         isValid: true, 
                                         displayBadge: info.displayBadge,
                                         statistics: info.displayBadge ? workers.getStatistics(tab)
                                                                       : null});
                }
            }
        }
    });

    controler.onContextMenuChanged.addListener(info => {
        if (info.activated) {
            browser.tabs.query({active: true}).then(tabs => {
                for (const tab of tabs) {
                    controler.contextMenu.update({enable: workers.isValidTab(tab)});
                }
            });
        }
    });
    
    controler.onActivated.addListener(info => {
        // context menu configuration
        if (info.activated) {
            browser.tabs.query({active: true}).then(tabs => {
                for (const tab of tabs) {
                    controler.contextMenu.update({enable: workers.isValidTab(tab)});
                }
            });
        }
        
        for (const tab of workers.getTabs()) {
            let isValid = workers.isValidTab(tab);
            
            controler.setStatus({tab: tab,
                                 isValid: isValid});
            
            if (isValid && (!controler.isManual() || !info.activated)) {
                for (const worker of workers.forTab(tab)) {
                    worker.sendMessage({id: info.activated ? 'parse' : 'undo'});
                }
            }
        }
    });

    controler.onUpdate.addListener(info => {
        if (info.action === 're-parse') {
            if (workers.isValidTab(info.tab))
                for (const worker of workers.forTab(info.tab)) {
                    worker.sendMessage({id: 're-parse'});
                }
        }
    });
    
}).catch(reason => console.error(reason));
