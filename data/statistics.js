
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Statistics management - Linkificator's module
 * author: MarkaPola */


function Statistics (document, action) {

	const countLabel = "linkificator-count";
	const timeLabel = "linkificator-time";

	var body = document.body;

    function getInt (value) {
        let v = parseInt(value, 10);
        return isNaN(v) ? 0 : v;
    }
    
	function getStats (count, time) {
		return {links: getInt(count), time: getInt(time)};
	}

	if (action == 'get-statistics') {
		return {
			get: function () {
				if (body.hasAttribute(countLabel)) {
					return getStats(body.getAttribute(countLabel),
									body.getAttribute(timeLabel));
				} else {
					return getStats(0, 0);
				}
			}
		}
	}

	var elapse = 0;
	var startTime = Date.now();

	if (action === 'parse') {
		body.setAttribute(countLabel, 0);
		body.setAttribute(timeLabel, 0);
	} else if (action == 're-parse') {
		elapse = getInt(body.getAttribute(timeLabel));
	}

    return {
		store: function (count) {
			let links = getInt(body.getAttribute(countLabel));

			body.setAttribute(countLabel, links+count);
			body.setAttribute(timeLabel, elapse+(Date.now()-startTime));
		},

        get: function () {
			if (body.hasAttribute(countLabel)) {
				return getStats(body.getAttribute(countLabel),
								body.getAttribute(timeLabel));
			} else {
				return getStats(0, 0);
			}
        }
    }
}
