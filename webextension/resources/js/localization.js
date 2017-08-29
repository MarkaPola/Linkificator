
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Localization helper - Linkificator's module
 * author: MarkaPola */

function translateElementAttributes(element) {
    const attributes = [ 'title', 'accesskey', 'alt', 'label', 'placeholder', 'abbr', 'content', 'download', 'srcdoc', 'value' ];
    const separator = '@';

    const presentAttributes = element.dataset.l10nAttrs.split(",");

    // Translate allowed attributes.
    for(let attribute of presentAttributes) {
        let data;
        if(attributes.includes(attribute)) {
            data = browser.i18n.getMessage(element.dataset.l10nId + separator + attribute);
        }
        
        if(data && data != "??") {
            element.setAttribute(attribute, data);
        }
    }
}

function translateElements() {
    const children = document.querySelectorAll('*[data-l10n-id]');
    for(let child of children) {
        if(!child.dataset.l10nNocontent) {
            const data = browser.i18n.getMessage(child.dataset.l10nId);
            if(data && data != "??") {
                child.textContent = data;
            }
        }

        if(child.dataset.l10nAttrs) {
            translateElementAttributes(child);
        }
    }
}



document.addEventListener("DOMContentLoaded",
                          () => translateElements(), 
                          {
                              capture: true,
                              passive: true,
                              once: true
                          });
