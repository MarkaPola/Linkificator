
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* tab history handling - Linkificator's module
 * author: MarkaPola */

//
// to retrieve statistics which are part of the DOM
//

var statistics = Statistics();

// catch backward/forward button events to handle widget update
function postStatistics (event) {
	if (event.persisted) {
		self.port.emit('complete', statistics.get());
	}
}

function reset (event) {
	self.port.emit('reset');
}

	
self.port.on('attach', function () {
	window.top.addEventListener('pageshow', postStatistics, false);
	//window.top.addEventListener('pagehide', reset, false);
	// pagehide event is not binded because doing so generate asynchronous exceptions!?
});
