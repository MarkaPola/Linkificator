

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Release notes localization helper - Linkificator's module
 * author: MarkaPola */


function translateElements() {
    const children = document.querySelectorAll('*[data-l10n-id]');
    for(let child of children) {
        if(!child.dataset.l10nNocontent) {
            const data = browser.i18n.getMessage(child.dataset.l10nId);
            if(data && data.length != 0) {
                let fragment = document.createRange().createContextualFragment(data);
                child.insertBefore(fragment, child.firstChild);
            }
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
