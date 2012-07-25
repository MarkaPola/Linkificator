
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
		if (count == undefined)
			return {links: 0, time: 0};
		else if (count == -1)
			return {links: -1};
		else
			return {links: getInt(count), time: getInt(time)};
	}

    return {
        get countLabel () { return "linkificator-count"; },
        get timeLabel () { return "linkificator-time"; },
        
		store: function (document, count, time) {
			if (document.body) {
				let total = parseInt(document.body.getAttribute(this.countLabel));
				if (isNaN(total)) total = 0;
				total += count;

				document.body.setAttribute(this.countLabel, total);
				document.body.setAttribute(this.timeLabel, time);
				
				return getStats(total, time);
			} else {
				return getStats(count,time);
			}
		},

        'new': function () {
			switch (arguments.length) {
				case 1:
				let document = arguments[0];
				if (document.body) {
					return getStats (document.body.getAttribute(this.countLabel),
									 document.body.getAttribute(this.timeLabel));
				} else {
					return getStats(0,0);
				}
				break;
			case 2:
				return getStats (arguments[0], arguments[1]);
				break;
			case 0:
			default:
				return getStats(-1);
			}
        }
    }
}
