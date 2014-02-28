
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// australis-panel.js - Linkificator's module
// author: MarkaPola


//
// Manage Australis UI elements
//


"use strict";

const unload = require('../util/unload').unload;
const DOMGenerator = require('../util/dom');
    
const View = function (options, document) {
    if (!options) return;
    
    this.options = options;
    this.nodes = {};
    this.viewNode = DOMGenerator.fromJSON(options.content, document, this.nodes);
    
    this.onShow = function (event) {
        if (this.options.onShow)
            this.options.onShow(event, this.nodes);
    }.bind(this);
    this.onHide = function (event) {
        if (this.options.onHide)
            this.options.onHide(event, this.nodes);
    }.bind(this);
};


exports.Panel = function (options) {
    // check validity of properties
    if (!options.id) {
        throw new Error("id option is required");
    }
    if (!options.content) {
        throw new Error("content option is required");
    }

    return {
        id: options.id,
        
        onBuild: (function (document) {
            var view = new View(options, document);
            
            view.viewNode.setAttribute("id", options.id);
            view.viewNode.classList.add("PanelUI-subView");
            
            document.getElementById("PanelUI-history").parentElement.appendChild(view.viewNode);
            if (options.onShow) {
                view.viewNode.addEventListener('ViewShowing', view.onShow, false);
                unload(function () { view.viewNode.removeEventListener('ViewShowing', view.onShow, false); },  view.viewNode);
            }
            if (options.onHide) {
                view.viewNode.addEventListener('ViewHiding', view.onHide, false);
                unload(function () { view.viewNode.removeEventListener('ViewHiding', view.onHide, false); },  view.viewNode);
            }
            
            unload(function () {
                document.getElementById("PanelUI-history").parentElement.removeChild(view.viewNode);
            }, document);
        }).bind(this)
    };
};

