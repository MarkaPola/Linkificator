
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// author: MarkaPola

//
// Manage the options page of the add-on
//

Promise.prototype.finally = function (cb) {
   return this.then(v => Promise.resolve(cb(v)),
                    v => Promise.reject(cb(v)));
};

function managePopup (context) {
    $('panel-options').addEventListener('click', event => {
        browser.runtime.openOptionsPage().finally(() => window.close());
    });

    let manual = $('panel-manual');
    manual.checked = context.manual;
    manual.addEventListener('click', event => {
        browser.storage[context.area].set({manual: manual.checked}).finally(() => window.close());
    });

    let activate = $('panel-activate');
    let deactivate = $('panel-deactivate');
    if (context.activated) {
        $('entry-activate').setAttribute('style', 'display: none');
        $('panel-deactivate').addEventListener('click', event => {
            browser.storage[context.area].set({activated: false}).finally(() => window.close());
        });
    } else {
        $('entry-deactivate').setAttribute('style', 'display: none');
        $('panel-activate').addEventListener('click', event => {
            browser.storage[context.area].set({activated: true}).finally(() => window.close());
        });
    }

    let entry, manage;
    if (context.status === 'excluded' || context.status === 'filtered') {
        $('entry-exclude').setAttribute('style', 'display: none');
        entry = $('entry-include');
        manage = $('panel-include');
    } else {
        $('entry-include').setAttribute('style', 'display: none');
        entry = $('entry-exclude');
        manage = $('panel-exclude');
    }
    if (context.status === 'not_processed') {
        entry.classList.add('popup-entry-disabled');
    }
    manage.addEventListener('click', event => {
        browser.runtime.sendMessage({id: 'manage-url', info: context}).catch(reason => console.error(reason)).finally(() => window.close());
    });
    
    let linkify = $('panel-linkify');
    if (context.status === 'processed') {
        linkify.addEventListener('click', event => {
            browser.runtime.sendMessage({id: 're-parse', info: context}).catch(reason => console.error(reason)).finally(() => window.close());
        });
    } else {
        $('entry-linkify').classList.add('popup-entry-disabled');
    }
}


document.addEventListener("DOMContentLoaded",
                          () => {
                              // query current tab status
                              browser.runtime.sendMessage({id: 'tab-context'}).then(context => {
                                  managePopup(context);
                              }).catch(reason => console.error(reason));
                          }, 
                          {
                              capture: true,
                              passive: true,
                              once: true
                          });
