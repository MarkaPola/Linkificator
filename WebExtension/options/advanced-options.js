

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
    function setNumber (id, value) {
        $(id).value = value;
    }

    
    properties[id] = value;
        
    switch (id) {
        // predefined rules settings
    case 'predefinedRules':
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
        break;
        // custom rules
    case 'customRules':
        setCheckbox('before-predefined', properties.customRules.support.before);
        setCheckbox('after-predefined', properties.customRules.support.after);
        break;
        // extra features
    case 'extraFeatures':
        setCheckbox('inline-elements', properties.extraFeatures.support.inlineElements);
        setNumber('automatic-linkification.refresh-interval.value', properties.extraFeatures.autoLinkification.interval.value);
        setCheckbox('automatic-linkification.refresh-interval', properties.extraFeatures.autoLinkification.interval.active,
                    ['automatic-linkification.refresh-interval.value']);
        setNumber('automatic-linkification.refresh-threshold.value', properties.extraFeatures.autoLinkification.threshold.value);
        setCheckbox('automatic-linkification.refresh-threshold', properties.extraFeatures.autoLinkification.threshold.active,
                    ['automatic-linkification.refresh-threshold.value']);
        setCheckbox('automatic-linkification', properties.extraFeatures.support.automaticLinkification,
                    ['automatic-linkification.refresh-interval',
                     'automatic-linkification.refresh-interval.value',
                     'automatic-linkification.refresh-threshold',
                     'automatic-linkification.refresh-threshold.value']);
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

            return new Promise((resolve, reject) => {
                resolve();
            });
        });
    });
}

function managePreferences () {
    function addCheckboxManager (id, preference, childs) {
        let checkbox = $(id);
        checkbox.addEventListener('change', event => {
            preference = checkbox.checked;

            if (childs !== undefined) {
                for (let child of childs) {
                    $(child).disabled = !checkbox.checked;
                }
            }
        });
    }
    function addNumberManager (id, preference) {
        let number = $(id);
        number.addEventListener('change', event => {
            preference = Number(number.value);
        });
    }

    
    // predefined rules settings
    addCheckboxManager('email-address.use-TLD', properties.predefinedRules.support.email.useTLD);
    addCheckboxManager('email-address', properties.predefinedRules.support.email.active,
                       ['email-address.use-TLD']);

    addCheckboxManager('standard-urls.use-subdomains', properties.predefinedRules.support.standard.useSubdomains);
    addCheckboxManager('standard-urls.use-TLD', properties.predefinedRules.support.standard.useTLD);
    addCheckboxManager('standard-urls.linkify-authority', properties.predefinedRules.support.standard.linkifyAuthority);
    addCheckboxManager('standard-urls', properties.predefinedRules.support.standard.active,
                       ['standard-urls.use-subdomains',
                        'standard-urls.use-TLD',
                        'standard-urls.linkify-authority']);

    // custom rules
    addCheckboxManager('before-predefined', properties.customRules.support.before);
    addCheckboxManager('after-predefined', properties.customRules.support.after);

    // extra features
    addCheckboxManager('inline-elements', properties.extraFeatures.support.inlineElements);
    addNumberManager('automatic-linkification.refresh-interval.value', properties.extraFeatures.autoLinkification.interval.value);
    addCheckboxManager('automatic-linkification.refresh-interval', properties.extraFeatures.autoLinkification.interval.active,
                       ['automatic-linkification.refresh-interval.value']);
    addNumberManager('automatic-linkification.refresh-threshold.value', properties.extraFeatures.autoLinkification.threshold.value);
    addCheckboxManager('automatic-linkification.refresh-threshold', properties.extraFeatures.autoLinkification.threshold.active,
                       ['automatic-linkification.refresh-threshold.value']);
    addCheckboxManager('automatic-linkification', properties.extraFeatures.support.autoLinkification,
                       ['automatic-linkification.refresh-interval',
                        'automatic-linkification.refresh-interval.value',
                        'automatic-linkification.refresh-threshold',
                        'automatic-linkification.refresh-threshold.value']);
}


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
