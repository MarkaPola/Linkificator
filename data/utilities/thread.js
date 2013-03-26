
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Thread helper - Linkificator's module
 * author: MarkaPola */

// javascript does not support parallel executions
// to avoid any CPU total comsumption and UI freezes, this utility help execute tasks in the background

// arguments to Thread function are:
// action: object which MUST expose, at least, the following functions:
//   * execute: will execute a part of the work and must return true if work is completed
//   * finish: will execute all remaining tasks to complete the work
//   * abort: thread was aborted, remaining work must not be done
//   * complete: this function will be called when all work is done
// interval: waiting time (in ms) between each execution. If not specified, 10ms will be used.
// all functions are argumentless except abort and complete which pass thread reference.
//
// Thread functions are:
// start: launch execution of action object in the background.
// terminate: request to complete action in the foreground.
// kill: stop background execution. action will not terminate.
//
// Here is a small example: each part of the work will be done at 100ms interval.
//
// var test = {
//     	index: 0,
// 		total: 100,
// 		
// 		execute: function () {
// 			var part = Math.min((this.index + 3), this.total);
// 			while (this.index < part) {				
// 				console.log (this.index);
// 				this.index++;
// 			}
// 			console.log ("chunk done");
// 			
// 			return this.index == this.total;
// 		},
// 		finish: function () {
// 			while (this.index++ < this.total)
// 				console.log (this.index);
// 			console.log ("complete done");
// 		},
//      abort: function (thread) {
//           console.log ("aborted at " + this.index);
//      },
//      complete: function (thread) {
//           console.log ("completed");
//      }
// };
// 
// var thread = Thread (test, 100);
// thread.start ();
// 


function Thread (action, interval) {
    var thread = {
        ref: null, 
		interval: 10,
	    action: null,
		worker: null,
		completed: false
	};
	if (interval)
		thread.interval = interval;
	thread.action = action;
	
	function execute () {
		if (thread.completed)
			return;
		
		if (thread.action.execute()) {
            thread.completed = true;
			thread.action.complete(thread.ref);
		} else {
			thread.worker = setTimeout(execute, interval);
		}
	}
	
	function finish (timeout) {
		if (thread.completed)
			return;

		clearTimeout(thread.worker);

		let terminate = function() {
			thread.completed = true;
			thread.action.finish();
            thread.action.complete(thread.ref);
		};
		
		if (timeout) {
			thread.worker = setTimeout(terminate, timeout);
		} else {	
			terminate();
		}
	}
	
	function abort () {
		if (thread.completed)
			return;
		
		clearTimeout(thread.worker);

		thread.completed = true;
        thread.action.abort(thread.ref);
	}
	
	thread.ref = {
		start: function () {
			execute();
		},
	
		terminate: function (timeout) {
			finish();
		},
		
		kill: function () {
			abort();
		}
	};
    
	return thread.ref;
}
