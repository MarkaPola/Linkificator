
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// australis/panel.js - Linkificator's module
// author: MarkaPola


//
// Manage Australis UI elements
//


"use strict";

const unload = require('../../util/unload').unload;
const watchWindows = require('../../util/windows').watchWindows;
const DOMGenerator = require('../../util/dom');
    
const PanelTrait = function (options) {
    if (!options) return;
    
    this.options = options;

    this.handlers = {
        show: options.onShow,
        hide: options.onHide
    };
    
    this.onShow = function (event, nodes) {
        if (this.handlers.show)
            this.handlers.show(event, nodes);
    }.bind(this);
    this.onHide = function (event, nodes) {
        if (this.handlers.hide)
            this.handlers.hide(event, nodes);
    }.bind(this);

    this.views = new Set();
};

function createView (trait, document) {
    function onShow (event) {
        trait.onShow(event, nodes);
    }
    function onHide (event) {
        trait.onHide(event, nodes);
    }
    
    var nodes = {};
    var view = DOMGenerator.fromJSON(trait.options.content, document, nodes);
    trait.views.add(view);

    view.setAttribute("id", trait.options.id);
    view.classList.add("PanelUI-subView");
    
    document.getElementById("PanelUI-multiView").appendChild(view);
    view.addEventListener('ViewShowing', onShow, false);
    unload(function () { view.removeEventListener('ViewShowing', onShow, false); }, view);
    
    view.addEventListener('ViewHiding', onHide, false);
    unload(function () { view.removeEventListener('ViewHiding', onHide, false); },  view);
            
    unload(function () {
        document.getElementById("PanelUI-multiView").removeChild(view);
        trait.views.delete(view);
    }, document);
}

exports.Panel = function (options) {
    // check validity of properties
    if (!options.id) {
        throw new Error("id option is required");
    }
    if (!options.content) {
        throw new Error("content option is required");
    }

    let pt = new PanelTrait(options);
    
    function watcher (window) {
        createView(pt, window.document);
    }
    watchWindows(watcher);
    
    return {
        id: options.id,
        
        on: function (event, action) {
            if (event === 'show') {
			    pt.handlers.show = action;
		    } else if (event === 'hide') {
			    pt.handlers.hide = action;
		    }
        },
        
        destroy: function () {
            pt.views.forEach(function (view) {
                let document = view.ownerDocument;
                document.getElementById("PanelUI-multiView").removeChild(view);
            });
            pt.views.clear();
        }
    };
};

