
// utility function
function $ (id) {
	return document.getElementById(id);
}

//=============== settings management =====================
var properties = {};

function updatePreference (id, value) {
    function setCheckbox (id, checked) {
        $(id).checked = checked;
    }
    function setColorSelector (type, config) {
        setCheckbox(`override-${type}-color`, config.override);
        let colorPicker = $(`href-${type}-color`);
        colorPicker.value = config.color;
        colorPicker.disabled = !config.override;
    }
    
    properties[id] = value;
        
    switch (id) {
        // basic settings
    case 'activated':
        setCheckbox('activated', properties.activated);
        break;
    case 'manual':
        setCheckbox('on-demand', properties.manual);
        break;
    case 'displayBadge':
        setCheckbox('display-counter', properties.displayBadge);
        break;
    case 'contextMenuIntegration':
        setCheckbox('context-menu', properties.contextMenuIntegration);
        break;
        // domains management
    case 'domains':
        setCheckbox('use-regexp', properties.domains.useRegExp);
        $('domain-filtering-mode').value = properties.domains.type;
        let domainList = $('domains-list');
        if (properties.domains.type == 'none') {
            domainList.disabled = true;
            domainList.value = '';
        } else {
            domainList.disabled = false;
            domainList.value = properties.domains.list[properties.domains.type].join(' ');
        }
        break;
        // link colors management
    case 'style':
        setColorSelector('text', properties.style.text);
        setColorSelector('background', properties.style.background);
        break;
    case 'sync':
        // settings management
        setCheckbox('prefs-sync', properties.sync);
        
    }
}

function initializePreferences () {
    return browser.storage.local.get('sync').then(result => {
        properties.area = result.sync ? 'sync' : 'local';

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
    function addCheckboxManager (id, preference) {
        let checkbox = $(id);
        checkbox.addEventListener('change', event => {
            properties[preference] = checkbox.checked;
            browser.storage[properties.area].set({[preference]: properties[preference]}).catch(reason => console.error(reason));
        });
    }
    function addColorManager (type) {
        // checkbox
        let checkbox = $(`override-${type}-color`);
        let colorPicker = $(`href-${type}-color`);
        
        checkbox.addEventListener('change', event => {
            properties.style[type].override = checkbox.checked;
            colorPicker.disabled = !checkbox.checked;

            browser.storage[properties.area].set({style: properties.style}).catch(reason => console.error(reason));
        });
        colorPicker.addEventListener('change', event => {
            properties.style[type].color = colorPicker.value;

            browser.storage[properties.area].set({style: properties.style}).catch(reason => console.error(reason));
        });
    }
    
    addCheckboxManager('activated', 'activated');
    addCheckboxManager('on-demand', 'manual');
    addCheckboxManager('display-counter', 'displayBadge');
    addCheckboxManager('context-menu', 'contextMenuIntegration');

    // domain management
    let useRegex = $('use-regexp');
    let select = $('domain-filtering-mode');
    let domainList = $('domains-list');
    useRegex.addEventListener('change', event => {
        properties.domains.useRegExp = useRegex.checked;

        browser.storage[properties.area].set({domains: properties.domains}).catch(reason => console.error(reason));
    });
    select.addEventListener('change', event => {
        properties.domains.type = select.value;
        if (select.value === 'none') {
            domainList.disabled = true;
            domainList.value = '';
        } else {
            domainList.disabled = false;
            domainList.value = properties.domains.list[select.value].join(' ');
        }
    });
    domainList.addEventListener('change', event => {
        properties.domains.list[properties.domains.type] = domainList.value.split(' ');

        browser.storage[properties.area].set({domains: properties.domains}).catch(reason => console.error(reason));
    });
    
    // link colors management
    addColorManager('text');
    addColorManager('background');

    // settings management
    let prefsSync = $('prefs-sync');
    let prefsDefault = $('prefs-defaults');
    prefsSync.addEventListener('change', event => {
        browser.runtime.sendMessage({id: 'change-area', sync: prefsSync.checked}).then(message => {
            initializePreferences();
        }).catch(reason => console.error(reason));
    });
    prefsDefault.addEventListener('click', event => {
        browser.runtime.sendMessage({id: 'reset-defaults'}).then(message => {
            initializePreferences();
        }).catch(reason => console.error(reason));
    });
}

// audit storage changes for some preferences which can be changes outside options page
browser.storage.onChanged.addListener((changes, area) => {
    if (area === properties.area) {
        if (changes.hasOwnProperty('disabled'))
            updatePreference('disabled', changes.disabled.newValue);
        if (changes.hasOwnProperty('manual'))
            updatePreference('manual', changes.manual.newValue);
    }
});


document.addEventListener("DOMContentLoaded",
                          () => {
                              translateElements();
                              initializePreferences().then(() => {
                                  managePreferences();
                              });
                          }, 
                          {
                              capture: true,
                              passive: true,
                              once: true
                          });
