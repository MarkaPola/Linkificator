
// utility function
function $ (id) {
	return document.getElementById(id);
}

//=============== dropdown menu handling =====================
// to show menu on button click
document.getElementById("dropdown-button").addEventListener("click", event => 
                                                            $("dropdown-content").classList.toggle("dropdown-show"),
                                                            {
                                                                capture: true
                                                            });

// Close the dropdown menu if the user clicks outside of it
window.addEventListener("click", event => {
    if (!event.target.matches('.dropdown-button')) {

        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let element of dropdowns) {
            if (element.classList.contains('dropdown-show')) {
                element.classList.remove('dropdown-show');
            }
        }
    }
});

//=============== settings management =====================
function initializePreferences () {
    function setCheckbox (id, checked) {
        $(id).checked = checked;
    }
    function setColorSelector (type, config) {
        setCheckbox(`override-${type}-color`, config.override);
        let colorPicker = $(`href-${type}-color`);
        colorPicker.value = config.color;
        colorPicker.disabled = !config.override;
    }
    
    return browser.storage.local.get('sync').then(result => {
        let area = result.sync ? 'sync' : 'local';

        return browser.storage[area].get().then(result => {
            let properties = result;
            properties.area = area;

            setCheckbox('activated', properties.activated);
            setCheckbox('on-demand', properties.manual);
            setCheckbox('display-counter', properties.displayBadge);
            setCheckbox('context-menu', properties.contextMenuIntegration);

            // domains management
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

            // link colors management
            setColorSelector('text', properties.style.text);
            setColorSelector('background', properties.style.background);

            // settings management
            setCheckbox('prefs-sync', area === 'sync');
            
            return new Promise((resolve, reject) => {
                resolve(properties);
            });
        });
    });
}

function managePreferences (properties) {
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
    let prefsDefault = $('prefs-default');
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


document.addEventListener("DOMContentLoaded",
                          () => {
                              translateElements();
                              initializePreferences().then(properties => {
                                  managePreferences(properties);
                              });
                          }, 
                          {
                              capture: true,
                              passive: true,
                              once: true
                          });
