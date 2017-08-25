

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// author: MarkaPola

//
// Manage the options page of the add-on
//

// utility functions
function $ (id) {
	return document.getElementById(id);
}

function openTab (event, tabName) {
    let tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

$('tab-links').addEventListener('click', event => openTab(event, 'links'));
$('tab-custom-rules').addEventListener('click', event => openTab(event, 'custom-rules'));
$('tab-configuration').addEventListener('click', event => openTab(event, 'configuration'));


//=============== settings management =====================
var properties = {};


function updatePreference (id, value) {
    function setCheckbox (id, checked, childs) {
        $(id).checked = checked;

        if (childs !== undefined) {
            for (let child of childs) {
                $(child).disabled = !checked;
            }
        }
    }
    function setInput (id, value) {
        $(id).value = value;
    }
    
    function joinProtocols (protocols) {
        let result = '';
        
        for (let p of protocols) {
            if (result.length > 0) result += ' ';
            result += p.pattern + '~' + p.term;
        }

        return result;
    }
    
    function joinSubdomains (subdomains) {
        let result = '';
        
        for (let s of subdomains) {
            if (result.length > 0) result += ' ';
            result += s.filter + '~' + s.pattern + '~' + s.term;
        }

        return result;
    }
    
    properties[id] = value;
        
    switch (id) {
    case 'requiredCharacters':
        setInput('required-characters', properties.requiredCharacters.join(''));
        break;
        // predefined rules settings
    case 'predefinedRules':
        /// tab Links
        setCheckbox('email-address.use-TLD', properties.predefinedRules.support.email.useTLD);
        setCheckbox('email-address', properties.predefinedRules.support.email.active,
                    ['email-address.use-TLD']);
        
        setCheckbox('standard-urls.use-subdomains', properties.predefinedRules.support.standard.useSubdomains);
        setCheckbox('standard-urls.use-TLD', properties.predefinedRules.support.standard.useTLD);
        setCheckbox('standard-urls.linkify-authority', properties.predefinedRules.support.standard.linkifyAuthority);
        setCheckbox('standard-urls', properties.predefinedRules.support.standard.active,
                    ['standard-urls.use-subdomains',
                     'standard-urls.use-TLD',
                     'standard-urls.linkify-authority']);
        /// tab Configuration
        setInput('protocols', joinProtocols(properties.predefinedRules.protocols));
        setInput('subdomains', joinSubdomains(properties.predefinedRules.subdomains));
        setInput('excluded-elements', properties.predefinedRules.excludedElements.join(' '));
        break;
    case 'topLevelDomains':
        /// tab Configuration
        setInput('generics-value', properties.topLevelDomains.generics.domains.join(' '));
        setCheckbox('generics', properties.topLevelDomains.generics.active,
                    ['generics-value',
                     'reset-generics']);
        setInput('country-codes-value', properties.topLevelDomains.countryCodes.domains.join(' '));
        setCheckbox('country-codes', properties.topLevelDomains.countryCodes.active,
                    ['country-codes-value',
                     'reset-country-codes']);
        setInput('geographics-value', properties.topLevelDomains.geographics.domains.join(' '));
        setCheckbox('geographics', properties.topLevelDomains.geographics.active,
                    ['geographics-value',
                     'reset-geographics']);
        setInput('communities-value', properties.topLevelDomains.communities.domains.join(' '));
        setCheckbox('communities', properties.topLevelDomains.communities.active,
                    ['communities-value',
                     'reset-communities']);
        setInput('brands-value', properties.topLevelDomains.brands.domains.join(' '));
        setCheckbox('brands', properties.topLevelDomains.brands.active,
                    ['brands-value',
                     'reset-brands']);
        break;
        // custom rules
    case 'customRules':
        setCheckbox('before-predefined', properties.customRules.support.before);
        setCheckbox('after-predefined', properties.customRules.support.after);
        break;
        // extra features
    case 'extraFeatures':
        /// tab Links
        setCheckbox('inline-elements', properties.extraFeatures.support.inlineElements);
        setInput('automatic-linkification.refresh-interval.value', properties.extraFeatures.autoLinkification.interval.value);
        setCheckbox('automatic-linkification.refresh-interval', properties.extraFeatures.autoLinkification.interval.active,
                    ['automatic-linkification.refresh-interval.value']);
        setInput('automatic-linkification.refresh-threshold.value', properties.extraFeatures.autoLinkification.threshold.value);
        setCheckbox('automatic-linkification.refresh-threshold', properties.extraFeatures.autoLinkification.threshold.active,
                    ['automatic-linkification.refresh-threshold.value']);
        setCheckbox('automatic-linkification', properties.extraFeatures.support.automaticLinkification,
                    ['automatic-linkification.refresh-interval',
                     'automatic-linkification.refresh-interval.value',
                     'automatic-linkification.refresh-threshold',
                     'automatic-linkification.refresh-threshold.value']);
        /// tab Configuration
        setInput('inline-elements-list', properties.extraFeatures.inlineElements.join(' '));
        setInput('max-data-size', properties.extraFeatures.maxDataSize);
        break;
    }
}

function initializePreferences () {
    return browser.storage.local.get({sync: false, activated: true}).then(result => {
        properties.area = result.sync ? 'sync' : 'local';
        properties.activated = result.activated;
        
        return browser.storage[properties.area].get().then(result => {
            for (let id in result)
                updatePreference(id, result[id]);

            return true;
        });
    });
}

function managePreferences () {
    function addCheckboxManager (id, update, childs) {
        let checkbox = $(id);
        checkbox.addEventListener('change', event => {
            update(checkbox.checked);

            if (childs !== undefined) {
                for (let child of childs) {
                    $(child).disabled = !checkbox.checked;
                }
            }
        });
    }
    function addInputManager (id, update) {
        let input = $(id);
        input.addEventListener('change', event => {
            update(input.value);
        });
    }
    function store (property) {
        browser.storage[properties.area].set(property).catch(reason => console.error(reason));
    }
    function addResetManager(id, preference = id) {
        $(`reset-${id}`).addEventListener('click', event => {
            browser.runtime.sendMessage({id: `reset-${preference}`}).catch(reason => console.error(reason));
        });
    }
    

    addInputManager('required-characters',
                    (value) => {
                        properties.requiredCharacters = value.split('');
                        store({requiredCharacters: properties.requiredCharacters});
                    });
    addResetManager('required-characters', 'requiredCharacters');
    
    // predefined rules settings
    //// tab Links
    addCheckboxManager('email-address.use-TLD',
                       (value) => {
                           properties.predefinedRules.support.email.useTLD = value;
                           store({predefinedRules: properties.predefinedRules});
                       });
    addCheckboxManager('email-address',
                       (value) => {
                           properties.predefinedRules.support.email.active = value;
                           store({predefinedRules: properties.predefinedRules});
                       },
                       ['email-address.use-TLD']);

    addCheckboxManager('standard-urls.use-subdomains',
                       (value) => {
                           properties.predefinedRules.support.standard.useSubdomains = value;
                           store({predefinedRules: properties.predefinedRules});
                       });
    addCheckboxManager('standard-urls.use-TLD',
                       (value) => {
                           properties.predefinedRules.support.standard.useTLD = value;
                           store({predefinedRules: properties.predefinedRules});
                       });
    addCheckboxManager('standard-urls.linkify-authority',
                       (value) => {
                           properties.predefinedRules.support.standard.linkifyAuthority = value;
                           store({predefinedRules: properties.predefinedRules});
                       });
    addCheckboxManager('standard-urls',
                       (value) => {
                           properties.predefinedRules.support.standard.active = value;
                           store({predefinedRules: properties.predefinedRules});
                       },
                       ['standard-urls.use-subdomains',
                        'standard-urls.use-TLD',
                        'standard-urls.linkify-authority']);
    //// tab Configuration
    addInputManager('protocols',
                    (value) => {
                        let protocols = [];

                        for (let v of value.split(' ')) {
                            let a = v.split('~');
                            if (a.length === 2)
                                protocols.push({pattern: a[0], term: a[1]});
                        }
                        properties.predefinedRules.protocols = protocols;
                        store({predefinedRules: properties.predefinedRules});
                    });
    addResetManager('protocols');
    addInputManager('subdomains',
                    (value) => {
                        let subdomains = [];

                        for (let v of value.split(' ')) {
                            let a = v.split('~');
                            if (a.length === 3)
                                subdomains.push({filter: a[0], pattern: a[1], term: a[2]});
                        }
                        properties.predefinedRules.subdomains = subdomains;
                        store({predefinedRules: properties.predefinedRules});
                    });
    addResetManager('subdomains');
    addInputManager('excluded-elements',
                    (value) => {
                        properties.predefinedRules.excludedElements = value.split(' ');
                        store({predefinedRules: properties.predefinedRules});
                    });
    addResetManager('excluded-elements', 'excludedElements');
    // Top level domqins
    //// tab Configuration
    addCheckboxManager('generics',
                       (value) => {
                           properties.topLevelDomains.generics.active = value;
                           store({topLevelDomains: properties.topLevelDomains});
                       },
                       ['generics-value',
                        'reset-generics']);
    addInputManager('generics-value',
                    (value) => {
                        properties.topLevelDomains.generics.domains = value.split(' ');
                        store({topLevelDomains: properties.topLevelDomains});
                    });
    addResetManager('generics');
    addCheckboxManager('country-codes',
                       (value) => {
                           properties.topLevelDomains.countryCodes.active = value;
                           store({topLevelDomains: properties.topLevelDomains});
                       },
                       ['country-codes-value',
                        'reset-country-codes']);
    addInputManager('country-codes-value',
                    (value) => {
                        properties.topLevelDomains.countryCodes.domains = value.split(' ');
                        store({topLevelDomains: properties.topLevelDomains});
                    });
    addResetManager('country-codes', 'countryCodes');
    addCheckboxManager('geographics',
                       (value) => {
                           properties.topLevelDomains.geographics.active = value;
                           store({topLevelDomains: properties.topLevelDomains});
                       },
                       ['geographics-value',
                        'reset-geographics']);
    addInputManager('geographics-value',
                    (value) => {
                        properties.topLevelDomains.geographics.domains = value.split(' ');
                        store({topLevelDomains: properties.topLevelDomains});
                    });
    addResetManager('geographics');
    addCheckboxManager('communities',
                       (value) => {
                           properties.topLevelDomains.communities.active = value;
                           store({topLevelDomains: properties.topLevelDomains});
                       },
                       ['communities-value',
                        'reset-communities']);
    addInputManager('communities-value',
                    (value) => {
                        properties.topLevelDomains.communities.domains = value.split(' ');
                        store({topLevelDomains: properties.topLevelDomains});
                    });
    addResetManager('communities');
     addCheckboxManager('brands',
                       (value) => {
                           properties.topLevelDomains.brands.active = value;
                           store({topLevelDomains: properties.topLevelDomains});
                       },
                       ['brands-value',
                        'reset-brands']);
    addInputManager('brands-value',
                    (value) => {
                        properties.topLevelDomains.brands.domains = value.split(' ');
                        store({topLevelDomains: properties.topLevelDomains});
                    });
    addResetManager('brands');

    // custom rules
    //// tab Links
    addCheckboxManager('before-predefined',
                       (value) => {
                           properties.customRules.support.before = value;
                           store({customRules: properties.customRules});
                       });
    addCheckboxManager('after-predefined',
                       (value) => {
                           properties.customRules.support.after = value;
                           store({customRules: properties.customRules});
                       });

    // extra features
    //// tab Links
    addCheckboxManager('inline-elements',
                       (value) => {
                           properties.extraFeatures.support.inlineElements = value;
                           store({extraFeatures: properties.extraFeatures});
                       });
    addInputManager('automatic-linkification.refresh-interval.value',
                    (value) => {
                        properties.extraFeatures.autoLinkification.interval.value = Number(value);
                        store({extraFeatures: properties.extraFeatures});
                    });
    addCheckboxManager('automatic-linkification.refresh-interval',
                       (value) => {
                           properties.extraFeatures.autoLinkification.interval.active = value;
                           store({extraFeatures: properties.extraFeatures});
                       },
                       ['automatic-linkification.refresh-interval.value']);
    addInputManager('automatic-linkification.refresh-threshold.value',
                    (value) => {
                        properties.extraFeatures.autoLinkification.threshold.value = Number(value);
                        store({extraFeatures: properties.extraFeatures});
                    });
    addCheckboxManager('automatic-linkification.refresh-threshold',
                       (value) => {
                           properties.extraFeatures.autoLinkification.threshold.active = value;
                           store({extraFeatures: properties.extraFeatures});
                       },                           
                       ['automatic-linkification.refresh-threshold.value']);
    addCheckboxManager('automatic-linkification',
                       (value) => {
                           properties.extraFeatures.support.autoLinkification = value;
                           store({extraFeatures: properties.extraFeatures});
                       },
                       ['automatic-linkification.refresh-interval',
                        'automatic-linkification.refresh-interval.value',
                        'automatic-linkification.refresh-threshold',
                        'automatic-linkification.refresh-threshold.value']);
    //// tab Configuration
    addCheckboxManager('inline-elements-list',
                       (value) => {
                           properties.extraFeatures.inlineElements = value.split(' ');
                           store({extraFeatures: properties.extraFeatures});
                       });
    addResetManager('inline-elements', 'inlineElements');
    addCheckboxManager('max-data-size',
                       (value) => {
                           properties.extraFeatures.maxDataSize = value;
                           store({extraFeatures: properties.extraFeatures});
                       });    
    addResetManager('max-data-size', 'maxDataSize');
}


// audit storage changes which can be done outside advanced options page
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.hasOwnProperty('sync'))
            properties.area = changes.sync.newValue ? 'sync' : 'local';
        
        if (changes.hasOwnProperty('activated'))
            properties.activated = changes.activated.newValue;
    }

    if (area === properties.area) {
        for (let key in changes) {
            updatePreference(key, changes[key].newValue);
        }
    }
});


document.addEventListener("DOMContentLoaded",
                          () => {
                              initializePreferences().then(() => {
                                  managePreferences();
                                  
                                  // Select default tab
                                  openTab({currentTarget: $('tab-links')}, 'links');
                              });
                          }, 
                          {
                              capture: true,
                              passive: true,
                              once: true
                          });
