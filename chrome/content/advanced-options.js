
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Advanced options management - Linkificator's module
 * author: MarkaPola */

const Cu = Components.utils;
const {Services} = Cu.import('resource://gre/modules/Services.jsm');

// utility function
function $ (id) {
	return document.getElementById(id);
}


var Utils = {
	/**
	 * Retrieves a string from global.properties string bundle, will throw if string isn't found.
	 * 
	 * @param {String} name  string name
	 * @return {String}
	 */
	getString: function (name)
	{
		// Randomize URI to work around bug 719376
		let stringBundle = Services.strings.createBundle("chrome://linkificator/locale/global.properties?" + Math.random());
		Utils.getString = function(name)
		{
			return stringBundle.GetStringFromName(name);
		}
		return Utils.getString(name);
	},

	/**
	 * Shows an alert message like window.alert() but with a custom title.
	 * 
	 * @param {Window} parentWindow  parent window of the dialog (can be null)
	 * @param {String} title  dialog title
	 * @param {String} message  message to be displayed
	 */
	alert: function (parentWindow, title, message) {
		if (!title)
			title = "Linkificator";
		Services.prompt.alert(parentWindow, title, message);
	}
};


//************** Custom Rules ************************
function CustomRule (rule) {
	if (rule === undefined) {
		this.name = "";
		this.pattern = "";
		this.url = "";
		this.active = true;
	} else {
		this.name = rule.name;
		this.pattern = rule.pattern;
		this.url = rule.url;
		this.active = rule.active;
	}
}
CustomRule.prototype = {
	validate: function () {
		let errorMessage = "";

		function check (regex) {
			try {
				RegExp (regex);
				return true;
			} catch (e) {
				if (errorMessage.length) errorMessage += "\n";
				errorMessage += e;
				return false;
			}
		}

		if (this.name.length == 0 || this.pattern.length == 0 || this.url.length == 0) {
			Utils.alert(window,
						Utils.getString('advanced-settings.rules-validation.title'),
						Utils.getString('advanced-settings.rules-validation.empty-field'));
			return false;
		}

		let patternValid = check(this.pattern);
		let urlValid = check(this.url);

		if (patternValid && urlValid)
			return true;

		if (!patternValid && !urlValid) {
			Utils.alert(window,
						Utils.getString('advanced-settings.rules-validation.title'),
						Utils.getString('advanced-settings.rules-validation.invalid-re')+"\n"+errorMessage);
		} else if (!patternValid) {
			Utils.alert(window,
						Utils.getString('advanced-settings.rules-validation.title'),
						Utils.getString('advanced-settings.rules-validation.invalid-pattern')+"\n"+errorMessage);
		} else {
			Utils.alert(window,
						Utils.getString('advanced-settings.rules-validation.title'),
						Utils.getString('advanced-settings.rules-validation.invalid-url')+"\n"+errorMessage);
		}
		
		return false;
	}
};


function Tooltip (tooltip) {
	this._tooltip = $(tooltip);
}
Tooltip.prototype = {
	update: function (rule) {
		if (rule) {
			this._tooltip.firstChild.setAttribute('value', rule.pattern);
			this._tooltip.firstChild.nextSibling.setAttribute('value', rule.url);
		} else {
			this._tooltip.firstChild.setAttribute('value', '?');
			this._tooltip.firstChild.nextSibling.setAttribute('value', '?');
		}
	}
};


function Panel (panel, callbacks) {
	this._panel = $(panel);

	this._callbacks = callbacks;

	this._name = $("advanced-settings.custom-rules.panel.name");
	this._pattern = $("advanced-settings.custom-rules.panel.pattern");
	this._url = $("advanced-settings.custom-rules.panel.url");
	
	this._handlers = {
		init: this.init.bind(this),
		validate: this.validate.bind(this),
		hide: this.hide.bind(this)
	};

	this._panel.addEventListener('popupshowing', this._handlers.init);

	$('advanced-settings.custom-rules.panel.ok').addEventListener('command', this._handlers.validate);
	$('advanced-settings.custom-rules.panel.cancel').addEventListener('command', this._handlers.hide);
}
Panel.prototype = {
	init: function (event) {
		this._rule = this._callbacks.start();
		this._name.value = this._rule.name;
		this._pattern.value = this._rule.pattern;
		this._url.value = this._rule.url;
	},

	validate: function (event) {
		// update rule
		this._rule.name = this._name.value;
		this._rule.pattern = this._pattern.value;
		this._rule.url = this._url.value;

		if (this._rule.validate()) {
			this.hide();
			this._callbacks.complete(this._rule);
		}
	},

	hide: function (event) {
		this._panel.hidePopup();
	},

	release: function () {
		// remove event listeners
		this._panel.removeEventListener('popupshowing', this._handlers.init);
		$('advanced-settings.custom-rules.panel.ok').removeEventListener('command', this._handlers.validate);
		$('advanced-settings.custom-rules.panel.cancel').addEventListener('command', this._handlers.hide);
	}
};

function ListItem (template, tooltip, rule, callbacks) {
	this._tooltip = tooltip;
	this._rule = rule;
	this._callbacks = callbacks;

	// create DOM element from template
	this._richlistitem = template.cloneNode(true);
	this._richlistitem.removeAttribute('id');
	this._richlistitem.removeAttribute('hidden');
	this._richlistitem._data = this;

	this._checkbox = this._richlistitem.firstChild.firstChild;
	this._checkbox.setAttribute('checked', this._rule.active);
	this._label = this._checkbox.nextSibling;
	this._label.setAttribute('value', this._rule.name);

	this._handlers = {
		drag: this._drag.bind(this),
		drop: this._drop.bind(this),
		setCheckbox: this._setCheckbox.bind(this),
		updateTooltip: this._updateTooltip.bind(this),
		remove: this._remove.bind(this)
	};

	// drap&drop handling
	this._label.addEventListener('dragstart', this._handlers.drag);
	this._label.addEventListener('drop', this._handlers.drop);

	// checkbox handling
	this._checkbox.addEventListener('command', this._handlers.setCheckbox);
	// tooltip handling
	this._label.addEventListener('mouseover', this._handlers.updateTooltip);
	// delete button handling
	this._label.nextSibling.nextSibling.addEventListener('command', this._handlers.remove);
}
ListItem.prototype = {
	_drag: function (event) {
		this._callbacks.drag(event, this);
	},
	_drop: function (event) {
		this._callbacks.drop(event, this);
	},

	_setCheckbox: function (event) {
		this._rule.active = this._checkbox.checked;
	},
	_updateTooltip: function (event) {
		this._tooltip.update(this._rule);
	},
	_remove: function (event) {
		this.release();
		this._callbacks.remove(this);
	},

	get node () {
		return this._richlistitem;
	},
	get rule () {
		return this._rule;
	},

	update: function () {
		this._label.setAttribute('value', this._rule.name);
	},

	release: function () {
		// remove event listeners
		this._label.removeEventListener('dragstart', this._handlers.drag);
		this._label.removeEventListener('drop', this._handlers.drop);

		this._checkbox.removeEventListener('command', this._handlers.setCheckbox);
		this._label.removeEventListener('mouseover', this._handlers.updateTooltip);
		this._label.nextSibling.nextSibling.removeEventListener('command', this._handlers.remove);
	},

	getRule: function (node) {
		return node._data._rule;
	},
	updateRule: function (node, rule) {
		node._data.update();
	},

	releaseNode: function (node) {
		node._data.release();
	}
}

function DragManager (event, listbox, item) {
	this._source = event.target;
	this._listbox = listbox;
	this._item = item;

	event.dataTransfer.setData("application/x-custom-rule", JSON.stringify(item.rule));
	event.dataTransfer.effectAllowed = "move";

	this._handlers = {
		drop: this._drop.bind(this),
		release: this.release.bind(this)
	};

	// bind all needed drag and drop events
	let list = listbox.node;
	list.addEventListener('dragover', this._dropAllowed);
	list.addEventListener('drop', this._handlers.drop);

	event.target.addEventListener('dragend', this._handlers.release);
}
DragManager.prototype = {
	_dropAllowed: function (event) {
		event.preventDefault();
	},
	_drop: function (event) {
	    this.drop(event, null);
	},

	drop: function (event, target) {
	    event.stopPropagation();
		event.preventDefault();

		if (target === this._item) {
			// nothing to do, cancel drag&drop operation
			event.dataTransfer.effectAllowed = "none";
		} else {
			this._listbox.remove(this._item);
			if (target) {
				this._listbox.insertBefore(this._item, target);
			} else {
				this._listbox.append(this._item);
			}
		}
	},

	release: function (event) {
		let list = this._listbox.node;
		list.removeEventListener('dragover', this._dropAllowed);
		list.removeEventListener('drop', this._handlers.drop);

		this._source.removeEventListener('dragend', this._handlers.release);
	}
};

function ListBox (listbox, itemTemplate, tooltip) {
	this._richlistbox = $(listbox);
	this._template = $(itemTemplate);

	this._tooltip = new Tooltip(tooltip);

	this._callbacks = {
		drag: this.drag.bind(this),
		drop: this.drop.bind(this),
		remove: this.remove.bind(this)
	};
}
ListBox.prototype = {
	get node () {
		return this._richlistbox;
	},

	get selectedIndex () {
		return this._richlistbox.selectedIndex;
	},
	set selectedIndex (index) {
		this._richlistbox.selectedIndex = index;
		this._richlistbox.ensureIndexIsVisible(index);
	},

	get currentRule () {
		return this._richlistbox.currentIndex == -1 ? null : ListItem.prototype.getRule(this._richlistbox.getItemAtIndex(this._richlistbox.currentIndex));
	},
	get selectedRule () {
		return this._richlistbox.selectedIndex == -1 ? null : ListItem.prototype.getRule(this._richlistbox.selectedItem);
	},

	getRowCount: function () {
		return this._richlistbox.getRowCount();
	},

	getRuleAtIndex: function (index) {
		return ListItem.prototype.getRule(this._richlistbox.getItemAtIndex(index));
	},

	load: function (rules) {
		for (let index = 0; index < rules.length; ++index) {
			this.add (new CustomRule(rules[index]));
		}
	},

	add: function (rule) {
		let item = new ListItem(this._template, this._tooltip, rule, this._callbacks);

		if (this._richlistbox.selectedIndex != -1) {
			this._richlistbox.insertBefore(item.node, this._richlistbox.selectedItem);
		} else {
			this._richlistbox.appendChild(item.node);
		}
		this._richlistbox.ensureElementIsVisible(item.node);
	},

	drag: function (event, item) {
		this._dragManager = new DragManager(event, this, item);
	},
	drop: function (event, item) {
		this._dragManager.drop(event, item);
	},

	insertBefore: function (newItem, refItem) {
		this._richlistbox.insertBefore(newItem.node, refItem.node);
	},
	append: function (listitem) {
		this._richlistbox.appendChild(listitem.node);
	},
	remove: function (listitem) {
		this._richlistbox.removeChild(listitem.node);
	},

	update: function (rule) {
		ListItem.prototype.updateRule (this._richlistbox.selectedItem, rule);
	},

	release: function () {
		this._dragManager.release();

		// release each listitem
		for (let index = this._richlistbox.getRowCount()-1; index >= 0; index--) {
			ListItem.prototype.releaseNode(ListItem.this._richlistbox.getItemAtIndex(index));
		}
	}
}

function CustomRules (preferences, defaults, properties) {
	var beforeList = new ListBox('advanced-settings.custom-rules.before-list',
								 'advanced-settings.custom-rules.itemTemplate',
								 'advanced-settings.custom-rules.tooltip');
	var afterList = new ListBox('advanced-settings.custom-rules.after-list',
								 'advanced-settings.custom-rules.itemTemplate',
								 'advanced-settings.custom-rules.tooltip');

	var panel = new Panel('advanced-settings.custom-rules.panel', {start: start, complete: finalize});

	var currentList = afterList;

	// fill lists
	let customRules = JSON.parse(preferences.getCharPref('customRules'));
	beforeList.load(customRules.beforeList);
	afterList.load(customRules.afterList);

	// list selection
	var deck = $('advanced-settings.custom-rules.deck');
	if (properties.ui.customRules != undefined) {
		let settings = properties.ui.customRules;

		deck.selectedIndex = settings.selectedList;
		$('advanced-settings.custom-rules.list-selection').selectedIndex = settings.selectedList;
		currentList = settings.selectedList == 0 ? beforeList : afterList;

		if (settings.selectedItem != -1) {
			currentList.selectedIndex = settings.selectedItem;
		}
	} else {
		deck.selectedIndex = 1;
		$('advanced-settings.custom-rules.list-selection').selectedIndex = 1;
	}

	function selectList (event) {
		currentList = this.selectedIndex == 0 ? beforeList : afterList;
		deck.selectedIndex = this.selectedIndex;
	}
	$('advanced-settings.custom-rules.list-selection').addEventListener('command', selectList);

	// current rule retrieval
	var addRule = false;
	function setAdd () {
		addRule = true;
	}
	function resetAdd () {
		addRule = false;
	}
	/// track mouse over Add button
	$('advanced-settings.custom-rules.add').addEventListener('mouseover', setAdd);
	$('advanced-settings.custom-rules.add').addEventListener('mouseout', resetAdd);
	function start () {
		if (addRule) {
			currentAction = 'add';
			return new CustomRule();
		} else {
			currentAction = 'edit';
			return currentList.currentRule;
		}
	}

	// current rule finalization
	var currentAction = 'edit';
	function finalize (rule) {
		if (currentAction == 'add') {
			currentList.add (rule);
		} else {
			currentList.update (rule);
		}
	}

	// build array of rules
	function getRules (list) {
		let count = list.getRowCount();
		let array = new Array(count);
		for (let index = 0; index < count; ++index) {
			array[index] = list.getRuleAtIndex(index);
		}

		return array;
	}

	return {
		retrieve: function () {
			// build object to be serialized by JSON
			let customRules = {};
			customRules.beforeList = getRules(beforeList);
			customRules.afterList = getRules(afterList);
			preferences.setCharPref('customRules', JSON.stringify(customRules));
			
			// keep some UI settings
			properties.ui.customRules = {};
			properties.ui.customRules.selectedList = deck.selectedIndex;
			properties.ui.customRules.selectedItem = currentList.selectedIndex;
		},

		release: function () {
			panel.release();
			beforeList.release();
			afterList.release();
			$('advanced-settings.custom-rules.list-selection').removeEventListener('command', selectList);
			$('advanced-settings.custom-rules.add').removeEventListener('mouseover', setState);
			$('advanced-settings.custom-rules.add').removeEventListener('mouseout', resetState);
		}
	}
}


//************** Configuration ************************
function Configuration (preferences, defaults, properties) {
	function resetProtocols (event) {
		preferences.clearUserPref('protocols');
	}
	function resetSubdomains (event) {
		preferences.clearUserPref('subdomains');
	}
	function resetExcludedElements (event) {
		preferences.clearUserPref('excludedElements');
	}

	// manage events
	$('advanced-settings.configuration.protocol.reset').addEventListener('command', resetProtocols);

	$('advanced-settings.configuration.subdomain.reset').addEventListener('command', resetSubdomains);

	$('advanced-settings.configuration.excludedElement.reset').addEventListener('command', resetExcludedElements);

	return {
		retrieve: function () {
			// nothing to do
		},

		release: function () {
			$('advanced-settings.configuration.protocol.reset').removeEventListener('command', resetProtocols);

			$('advanced-settings.configuration.subdomain.reset').removeEventListener('command', resetSubdomains);

			$('advanced-settings.configuration.excludedElement.reset').removeEventListener('command', resetExcludedElements);
		}
	}
}


var AdvancedSettings = (function () {
	var properties = null;
	var preferences = null;
	var defaults = null;

	var customRules = null;
	var configuration = null;

	return {
		init: function () {
			properties = window.arguments[0].wrappedJSObject;
			preferences = Services.prefs.getBranch('extensions.linkificator@markapola.');
	        defaults = Services.prefs.getDefaultBranch('extensions.linkificator@markapola.');

			//links = Links(preferences, properties);
			customRules = CustomRules(preferences, defaults, properties);
			configuration = Configuration(preferences, defaults, properties);

			// set previously selected tab
			if (properties.ui.selectedTab != undefined) {
				$('advanced-settings.tabbox').selectedIndex = properties.ui.selectedTab;
			}
		},

		release: function () {
			customRules.release();
			configuration.release();

			return true;
		},

		validate: function () {
			// retrieve changed values
			properties.changed = {};

			customRules.retrieve();
			configuration.retrieve();

			// keep some UI settings
			properties.ui.selectedTab = $('advanced-settings.tabbox').selectedIndex;

			return true;
		}
	};
})();
