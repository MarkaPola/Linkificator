
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
			try {
				let body = window.top.document.body;

				body.setAttribute(this.countLabel, count);
				body.setAttribute(this.timeLabel, time);
			} catch (e) {
				// possible exception if cross-site scripting occurs
				// in this case, statistics cannot not be stored
			}
			return getStats(count, time);
		},

        get: function () {
			let body = window.document.body;

			return getStats (body.getAttribute(this.countLabel),
							 body.getAttribute(this.timeLabel));
        }
    }
}
