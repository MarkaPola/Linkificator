
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// australis/menu.js - Linkificator's module
// author: MarkaPola


//
// Manage Australis UI elements
//


"use strict";

const {Cu} = require('chrome');
const {ShortcutUtils} = Cu.import('resource://gre/modules/ShortcutUtils.jsm');

const { toJSON: jsonify } = require("sdk/keyboard/utils");

const dom = require('../../util/dom');
const panels = require('./panel');


function MenuEvent (nodes)
{
    let menu = {};
    
    for (let id in nodes) {
        let entry = nodes[id];
        // add management interface for each menu entry
        menu[id] = {
            get node () {
                return entry;
            },
            
            set label (data) {
                entry.setAttribute('label', data);
            },
            set image (data) {
                entry.setAttribute('image', data);
            },
            set checked (data) {
                if (data)
                    entry.setAttribute('checked', 'true');
            }, 
            set shortcut (data) {
                let hotkey = jsonify(data);
                let keyNode = entry.ownerDocument.createElementNS(dom.NAMESPACES.xul, 'key');
                keyNode.setAttribute('modifiers', hotkey.modifiers.join(' '));
                keyNode.setAttribute('key', hotkey.key);
                entry.setAttribute('shortcut', ShortcutUtils.prettifyShortcut(keyNode));
            },
            get disabled () {
                let data = entry.getAttribute('disabled');
                return (data && data === 'true');
            }, 
            set disabled (data) {
                if (data)
                    entry.setAttribute('disabled', 'true');
                else
                    entry.removeAttribute('disabled');
            }
        };
    }

    return menu;
}

const MenuTrait = function (options) {
    if (!options) return;

    this.menu = null;
    
    this.handlers = {
        show: options.onShow,
        hide: options.onHide
    };
    
    this.onShow = function (event, nodes) {
        if (this.handlers.show)
            this.handlers.show(MenuEvent(nodes));
    }.bind(this);
    this.onHide = function (event, nodes) {
        if (this.handlers.hide)
            this.handlers.hide(MenuEvent(nodes));
    }.bind(this);

    if (options.onShow)
        options.onShow = this.onShow;
    if (options.onHide)
        options.onHide = this.onHide;
    
    this.panel = panels.Panel(options);
};

exports.Menu = function (options) {
    var mt = new MenuTrait(options);

    return {
        get panel () {
            return mt.panel;
        },

        on: function (event, action) {
            if (event === 'show') {
				mt.handlers.show = action;
			} else if (event === 'hide') {
				mt.handlers.hide = action;
			}
        },

        destroy: function () {
            mt.panel.destroy();
        }
    };
};
