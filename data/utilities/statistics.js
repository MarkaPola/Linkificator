
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
        get countLabel () { return "linkificator-count"; },
        get timeLabel () { return "linkificator-time"; },
        
		store: function (count, time) {
			let body = window.top.document.body;

			let total = parseInt(body.getAttribute(this.countLabel));
			if (isNaN(total)) total = 0;
			total += count;

			body.setAttribute(this.countLabel, total);
			body.setAttribute(this.timeLabel, time);
			
			return getStats(total, time);
		},

        get: function () {
			let body = window.document.body;

			return getStats (body.getAttribute(this.countLabel),
							 body.getAttribute(this.timeLabel));
        }
    }
}
