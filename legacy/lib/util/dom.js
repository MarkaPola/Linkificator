
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// dom.js - Linkificator's module
// author: MarkaPola
//

//
// DOM tools
//

const NAMESPACES = {
    html: "http://www.w3.org/1999/xhtml",
    xul: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
};

var defaultNamespace = NAMESPACES.xul;

exports.NAMESPACES = Object.freeze(NAMESPACES);
exports.defaultNamespace = exports.NAMESPACES.xul;

/*
 * Generates a Document fragment from a JSON structure
 *
 * @param [object] json: JSON structure describing DOM to generate
 * @param [object] document: DOM object used to generate new elements
 * @output [array] nodes: list of nodes with attribute 'key' in JSON description
*/
function fromJSON (json, document, nodes) {
    const unload = require('./unload').unload;
    
    function namespace(name) {
        var m = /^(?:(.*):)?(.*)$/.exec(name);
        return [NAMESPACES[m[1]], m[2]];
    }
    
    function tag(name, attr) {
        if (Array.isArray(name)) {
            var frag = document.createDocumentFragment();
            Array.forEach(arguments, function (arg) {
                if (!Array.isArray(arg[0]))
                    frag.appendChild(tag.apply(null, arg));
                else
                    arg.forEach(function (arg) {
                        frag.appendChild(tag.apply(null, arg));
                    });
            });
            return frag;
        }

        var args = Array.slice(arguments, 2);
        var vals = namespace(name);
        var elem = document.createElementNS(vals[0] || defaultNamespace,
                                            vals[1]);

        for (var key in attr) {
            var val = attr[key];
            if (nodes && key == "key")
                nodes[val] = elem;

            vals = namespace(key);
            if (typeof val == "function") {
                elem.addEventListener(key, val, false);
                unload (function () { elem.removeEventlistener(key, val, false); }, elem);
            } else
                elem.setAttributeNS(vals[0] || "", vals[1], val);
        }
        args.forEach(function(e) {
            elem.appendChild(typeof e == "object" ? tag.apply(null, e) :
                             e instanceof Node    ? e : document.createTextNode(e));
        });
        return elem;
    }
    return tag.apply(null, json);
}

exports.fromJSON = fromJSON;
