
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* tabs.activate event - Linkificator's module
 * author: MarkaPola */

//
// to retrieve statistics which are part of the DOM
//

var statistics = Statistics();

self.port.on('get-stats', function () {
	self.port.emit('complete', statistics.get());
});
