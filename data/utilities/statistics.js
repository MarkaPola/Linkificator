
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Statistics core - Linkificator's module
 * author: MarkaPola */

//
// handle statistics
//

function Statistics () {
    function getInt (value) {
        let v = parseInt(value);
        return isNaN(v) ? 0 : v;
    }
    
	function getStats (count, time) {
		return {links: getInt(count), time: getInt(time)};
	}

    return {
        get statusLabel () { return "linkificator-status"; },
        get countLabel () { return "linkificator-count"; },
        get timeLabel () { return "linkificator-time"; },
        
		start: function (document) {
			let body = document.body;

			if (body.hasAttribute(this.statusLabel)) {
				return false;
			} else {
				body.setAttribute(this.statusLabel, "in-process");
				body.setAttribute(this.countLabel, 0);
				body.setAttribute(this.timeLabel, 0);

				return true;
			}
		},
		inProcess: function(document) {
			let body = document.body;

			return body.hasAttribute(this.statusLabel)
				&& body.getAttribute(this.statusLabel) == "in-process";
		},
		complete: function (document) {
			document.body.setAttribute(this.statusLabel, "complete");
		},
		isComplete:  function(document) {
			let body = document.body;

			return body.hasAttribute(this.statusLabel)
				&& body.getAttribute(this.statusLabel) == "complete";
		},

		store: function (document, count, time) {
			let body = document.body;
			let links = getInt(body.getAttribute(this.countLabel));

			body.setAttribute(this.countLabel, links+count);
			body.setAttribute(this.timeLabel, Date.now()-time);
		},

        get: function (document) {
			let body = document.body;

			if (body.hasAttribute(this.countLabel)) {
				return getStats(body.getAttribute(this.countLabel),
								body.getAttribute(this.timeLabel));
			} else {
				return getStats(0, 0);
			}
        }
    }
}
