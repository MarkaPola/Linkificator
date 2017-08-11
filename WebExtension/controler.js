
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// controler.js - Linkificator's module
// author: MarkaPola


//
// Manage UI controling linkificator behavior
//

function Controler (properties) {
    class ListenerManager {
        constructor () {
            this._listeners = new Set();
        }

        [Symbol.iterator]() {
            return this._listeners[Symbol.iterator]();
        }
        
        addListener (listener) {
            this._listeners.add(listener);
        }
        removeListener (listener) {
            this._listeners.delete(listener);
        }
        hasListener (listener) {
            this._listeners.has(listener);
        }

        every (infos) {
            for (let listener of this._listeners) {
                listener(infos);
            }
        }
    }

    var excludedURLs = new class {
        constructor () {
            this._urls = new Array();
        }
        
		add (url) {
			if (this._urls.indexOf(url) == -1) {
				this._urls.push(url);
				return true;
			}
			return false;
		}
		remove (url) {
			let index = this._urls.indexOf(url);
			if (index != -1) {
				this._urls.splice(index, 1);
				return true;
			}
			return false;
		}
        
        // return true if url is excluded, false otherwise
		toggle (url) {
			let index = this._urls.indexOf(url);
			if (index == -1) {
				this._urls.push(url);
				return true;
			} else {
				this._urls.splice(index, 1);
				return false;
			}
		}

		isExcluded (url) {
			return this._urls.indexOf(url) != -1;
		}
	};

    var includedURLs = new class {
        constructor () {
            this._urls = new Map();
        }
        
		add (tab) {
            this._urls.set(tab.id, tab.url);
		}
		remove (tab) {
            this._urls.delete(tab.id);
		}
        update (tab) {
            if (tab === undefined) return;
            
            let id = tab.id;
            
            let url = this._urls.get(id);
            if (url && (tab.url !== url)) {
                this._urls.delete(id);
            }
        }
            
        // return true if url is included, false otherwise
		toggle (tab) {
            let id = tab.id;
            
            if (this._urls.has(id)) {
                this._urls.delete(id);
                return false;
            } else {
                this._urls.set(id, tab.url);
                return true;
            }
		}

		isIncluded (tab) {
            let url = this._urls.get(tab.id);
            
            return url && (tab.url === url);
		}
	};


    //
    // utility functions
    //
    function isActive () {
        return properties.activated;
    }
    function isManual () {
        return properties.manual;
    }
    function displayBadge () {
        return properties.displayBadge;
    }

    function isValidURL (url) {
        if (properties.domains.type === 'none')
			return true;

		let useRegExp = properties.domains.useRegExp;
        let flag = properties.domains.type === 'white';
		let list = properties.domains.list[properties.domains.type];

		let index = 0;
		while (index != list.length) {
			if (useRegExp) {
				if (url.match(new RegExp(list[index++], "i"))) {
					return flag;
				}
			} else {
				if (url.toLowerCase().indexOf(list[index++]) != -1) {
					return flag;
				}
			}
		}
		
        return !flag;
    }

    function tabStatus (request) {
        let state = 'not_processed';
        
        let tab = request.tab;
        
		if (isActive() && request.isValid) {
			if (excludedURLs.isExcluded(tab.url)) {
				state = 'excluded';
			} else if (isValidURL(tab.url)) {
				state = 'processed';
			} else {
				state = 'filtered';
			}
		} else {
			state = 'not_processed';
		}

        return state;
    }
    
    let badgeListeners = new ListenerManager();
    let activateListeners = new ListenerManager();
    let updateListeners = new ListenerManager();
    let contextMenuListeners = new ListenerManager();
    

    var browserAction = (function () {
        function getDefault () {
            return {
                state: isActive() ? 'processed' : 'not_processed', 
                icon: isActive() ? (isManual() ? { 16: 'resources/icons/link16-manual.png',
                                                   32: 'resources/icons/link32-manual.png'}
                                               : {16: 'resources/icons/link16-on.png',
                                                  32: 'resources/icons/link32-on.png'})
                                 : {16: 'resources/icons/link16-off.png',
                                    32: 'resources/icons/link32-off.png'},
                badge: isActive() && displayBadge() ? "0" : "", 
                tooltip: isActive() ?  browser.i18n.getMessage("stats.0links") + " " + browser.i18n.getMessage("stats.time", 0)
                                    : browser.i18n.getMessage("stats.not_processed")
            };
        }
        function getCurrent (request) {
            var current = getDefault();
            let tab = request.tab;
            
			if (isActive() && request.isValid) {
				if (excludedURLs.isExcluded(tab.url)) {
					current.state = 'excluded';
					current.icon = {16: 'resources/icons/link16-excluded.png',
                                    32: 'resources/icons/link32-excluded.png'},
                    current.badge = "";
					current.tooltip = browser.i18n.getMessage("stats.excluded");
				} else if (isValidURL(tab.url)) {
					current.state = 'processed';
					current.icon = isManual() ? { 16: 'resources/icons/link16-manual.png',
                                                   32: 'resources/icons/link32-manual.png'}
                                               : {16: 'resources/icons/link16-on.png',
                                                  32: 'resources/icons/link32-on.png'}, 
                    current.badge = displayBadge() ? "0" : "";
					current.tooltip = browser.i18n.getMessage("stats.0links") + " " + browser.i18n.getMessage("stats.time", 0);
				} else {
					current.state = 'filtered';
					current.icon = {16: 'resources/icons/link16-excluded.png',
                                    32: 'resources/icons/link32-excluded.png'}, 
                    current.badge = "";
					current.tooltip = browser.i18n.getMessage("stats.filtered");
				}
			} else {
				current.icon = isActive() ? (isManual() ? { 16: 'resources/icons/link16-manual.png',
                                                            32: 'resources/icons/link32-manual.png'}
                                                        : {16: 'resources/icons/link16-on.png',
                                                           32: 'resources/icons/link32-on.png'})
                                          : {16: 'resources/icons/link16-off.png',
                                             32: 'resources/icons/link32-off.png'};
				current.state = 'not_processed';
                current.badge = "";
				current.tooltip = browser.i18n.getMessage("stats.not_processed");
			}

            return current;
        }

        return {
            update: function (request) {
                if (request.hasOwnProperty('initial')) {
                    let state = getDefault();
                                        
                    browser.browserAction.setIcon({path: state.icon});
                    browser.browserAction.setTitle({title: browser.i18n.getMessage("stats.not_processed")});
                    browser.browserAction.setBadgeText({text: ""});
                } else if (request.hasOwnProperty('manual')) {
                    if (isActive()) {
                        let state = getDefault();
                        
                        browser.tabs.query({}).then(tabs => {
                            for (const tab of tabs) {
                                browser.browserAction.setIcon({tabId: tab.id, path: state.icon});
                            }
                        });
                    }
                } else if (request.hasOwnProperty('statistics')) {
                    if (request.hasOwnProperty('displayBadge')) {
                        if (request.displayBadge) {
                            let count = request.statistics.links;
                            if (count > 999) count = "999+";
                            
                            if (request.tab) {
                                browser.browserAction.setBadgeText({tabId: request.tab.id,
                                                                    text: count.toString()});
                            } else {
                                // ignore request
                            }
                        } else {
                            if (request.tab)
                                browser.browserAction.setBadgeText({tabId: request.tab.id, text: ""});
                            else {
                                browser.tabs.query({}).then(tabs => {
                                    for (const tab of tabs) {
                                        browser.browserAction.setBadgeText({tabId: tab.id, text: ""});
                                    }
                                });
                            }
                        }
                    }
                    if (request.hasOwnProperty('displayTooltip')) {
                        let stats = request.statistics;
                        let tooltip;
                        
                        switch (stats.links) {
                        case 0:
                            tooltip = browser.i18n.getMessage("stats.0links");
                            break;
                        case 1:
                            tooltip = browser.i18n.getMessage("stats.1link");
                            break;
                        default:
                            tooltip = browser.i18n.getMessage("stats.links", stats.links);
                        }
                        tooltip += " " + browser.i18n.getMessage("stats.time", stats.time);

                        let tabId = request.tab.id;
                        browser.browserAction.setTitle({tabId: tabId, title: tooltip});
                    }
                } else {
                    let state = getCurrent(request);
                    let tabId = request.tab.id;
                    
                    browser.browserAction.setIcon({tabId: tabId, path: state.icon});
                    browser.browserAction.setTitle({tabId: tabId, title: state.tooltip});
                    browser.browserAction.setBadgeText({tabId: tabId, text: state.badge});
                }
            }
        };
    })();


    // Context menu handling
    var contextMenu = new class ContextMenu {
        constructor() {
            this._contextMenu = null;
            this._onClicked = ((info, tab) => {
                if (info.menuItemId !== this._contextMenu) return;

                updateListeners.every({action: 're-parse', tab: tab});
            }).bind(this);

            if (properties.contextMenuIntegration)
                this.activate();
        }

        activate () {
            if (!this._contextMenu) {
                this._contextMenu = browser.contextMenus.create({
                    contexts: ['tab', 'page'],
                    documentUrlPatterns: ["*://*/*", "file:///*"],
                    enabled: false, 
                    title: browser.i18n.getMessage("menu.linkify")
                });

                browser.contextMenus.onClicked.addListener(this._onClicked);
            }
        }

        update (info) {
            if (this._contextMenu) {
                if (info.tabId) {
                    // do update only if tabId matches one of active tabs
                    browser.tabs.query({active: true}).then(tabs => {
                        let id = tabs.find(tabInfo => tabInfo.id === info.tabId);

                        if (id) browser.contextMenus.update(this._contextMenu, {enabled: info.enable});
                    });
                } else {
                    browser.contextMenus.update(this._contextMenu, {enabled: info.enable});
                }
            }
        }
        
        destroy () {
            if (this._contextMenu) {
                browser.contextMenus.remove(this._contextMenu);
                browser.contextMenus.onClicked.removeListener(this._onClicked);
                this._contextMenu = null;
            }
        }
    };

    
    // handle preferences changes
    browser.storage.onChanged.addListener((changes,  area) => {
        if (area === 'local') {
            if (changes.hasOwnProperty('activated')) {
                if (!changes.activated.newValue)
                    contextMenu.update({enable: false});
                
                browser.tabs.query({}).then (tabs => {
                    for (const tab of tabs) {
                        // set global browserAction state
                        browserAction.update({tab: tab});
                    }
                    
                    activateListeners.every({activated: changes.activated.newValue});
                });
            }
        }
        
        if (area !== properties.area) return;

        for (let key in changes) {
            properties[key] =  changes[key].newValue;
            switch (key) {
            case 'displayBadge':
                badgeListeners.every({displayBadge: properties.displayBadge});
                break;
            case 'manual':
                // update globally browserAction color
                browserAction.update({manual: isManual()});
                break;
            case 'contextMenuIntegration':
                if (properties.contextMenuIntegration) {
                    contextMenu.activate();
                } else {
                    contextMenu.destroy();
                }

                contextMenuListeners.every({activated: properties.contextMenuIntegration});
            }
        }
    });

    /// startup initialization
    // initialize browserAction status for existing tabs
    browserAction.update({initial: true});

    
    return {
        isActive: function () {
            return isActive();
        },
        isManual: function () {
            return isManual();
        }, 
		linkifyURL: function (tab) {
            if (!tab.url) return false;
			return !excludedURLs.isExcluded(tab.url) && (includedURLs.isIncluded(tab) || isValidURL(tab.url));
		},

        setStatus: function (request) {
            includedURLs.update(request.tab);
			browserAction.update(request);
		},
        getStatus: function (request) {
            return tabStatus(request);
        },
        
        get contextMenu () {
            return contextMenu;
        },
        
        get onBadgeChanged () {
            return badgeListeners;
        },
        get onContextMenuChanged () {
            return contextMenuListeners;
        }, 
        get onActivated () {
            return activateListeners;
        },
        get onUpdate () {
            return updateListeners;
        }
    };
}
