
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// author: MarkaPola

//
// Manage the custom rules UI
//

//// Rule editor
class RuleEditor {
    constructor (options) {
        this._editor = document.getElementById('rule-editor');
        this._name = $('rule-editor.rule-name');
        this._pattern = $('rule-editor.rule-pattern');
        this._url = $('rule-editor.rule-url');

        this._error = $('rule-editor.error');
        
        this._onDefaultCancel = options.onCancel;
        this._onDefaultOK = options.onOK;

        ///// error message management
        // handle alarm event to clear error message
        browser.alarms.onAlarm.addListener(alarm => {
            if (alarm.name === 'rule-editor.clear-error');
            $('rule-editor.error').textContent = "";
        });
        
        // handle event focus on various fields to clean-up error message
        this._name.addEventListener('focus', event => {
            $('rule-editor.error').textContent = "";
            browser.alarms.clear('rule-editor.clear-error');
        });
        this._pattern.addEventListener('focus', event => {
            $('rule-editor.error').textContent = "";
            browser.alarms.clear('rule-editor.clear-error');
        });
        this._url.addEventListener('focus', event => {
            $('rule-editor.error').textContent = "";
            browser.alarms.clear('rule-editor.clear-error');
        });

        // handle buttons
        $('rule-editor.cancel').addEventListener('click', event => {
            this._editor.style.display = 'none';
            if (this._onCancel) {
                this._onCancel(event);
            } else if (this._onDefaultCancel) {
                this._onDefaultCancel(event);
            }
            
            this._onCancel = undefined;
            this._onOK = undefined;
        });
        $('rule-editor.OK').addEventListener('click', event => {
		    function check (regex) {
			    try {
				    new RegExp (regex);
				    return true;
			    } catch (e) {
				    return false;
			    }
		    }
            function displayError (id) {
                $('rule-editor.error').textContent = browser.i18n.getMessage(id);
                // create an alarm to erase error message
                browser.alarms.create('rule-editor.clear-error', {when: Date.now()+5000});
            }
            
            if (this._name.value.length === 0
                || this._pattern.value.length === 0
                || this._url.value.length === 0) {
                displayError('advancedSettings@customRules@ruleEditor@emptyField');
                
                return;
            }

            let patternValid = check(this._pattern.value);
		    let urlValid = check(this._url.value);

		    if (!patternValid || !urlValid) {
                if (!patternValid && !urlValid) displayError('advancedSettings@customRules@ruleEditor@invalidRE');
                else if (!patternValid) displayError('advancedSettings@customRules@ruleEditor@invalidPattern');
                else displayError('advancedSettings@customRules@ruleEditor@invalidURL');
                
			    return;
            }
            
            this._editor.style.display = 'none';
            if (this._onOK) {
                this._onOK(event, {name: this._name.value,
                                   pattern: this._pattern.value,
                                   url: this._url.value});
            } else if (this._onDefaultOK) {
                this._onDefaultOK(event, {name: this._name.value,
                                          pattern: this._pattern.value,
                                          url: this._url.value});                
            }
            
            this._onCancel = undefined;
            this._onOK = undefined;
        });
    }

    editRule (options) {
        this._onCancel = this._onDefaultCancel;
        this._onOK = this._onDefaultOK;

        if (options.onCancel) this._onCancel = options.onCancel;
        if (options.onOK) this._onOK = options.onOK;

        this._name.value = options.rule.name;
        this._pattern.value = options.rule.pattern;
        this._url.value = options.rule.url;

        this._error.textContent = "";
        
        this._editor.style.display = 'block';
    }
    
    newRule (options) {
        options.rule = {name:"", pattern:"", url:""};
        this.editRule (options);
    }
}
var ruleEditor = new RuleEditor({});

class CustomRule {
    _editRule (event) {
        let rule = this._node.querySelector('.rule-name');
            
        function updateRule (event, newRule) {
            rule.textContent = newRule.name;
            rule.dataset.pattern = newRule.pattern;
            rule.dataset.url = newRule.url;

            if (this._options.onEdit) this._options.onEdit(this);
        }
            
        ruleEditor.editRule({rule: {name: rule.textContent,
                                    pattern: rule.dataset.pattern,
                                    url: rule.dataset.url},
                             onOK: updateRule.bind(this)
                            });
    }
    _deleteRule (event) {
        this.release();
        
        if (this._options.onDelete) this._options.onDelete(this);
    }
    
    constructor (options) {
        this._options = options;
        
        // create DOM object tree
        let rule = options.rule;
        
        this._node = document.importNode(document.getElementById('custom-rule-template').content, true).querySelector('.settings-rule');
        this._node.querySelector('.rule-active').checked = rule.active;
        let ruleName = this._node.querySelector('.rule-name');
        ruleName.textContent = rule.name;
        ruleName.dataset.pattern = rule.pattern;
        ruleName.dataset.url = rule.url;

        // attach actions for edition/deletion
        this._node.querySelector('.edit-button').addEventListener('click', this._editRule.bind(this));
        this._node.querySelector('.delete-button').addEventListener('click', this._deleteRule.bind(this));
    }

    update (options) {
        this._options = options;
        
        let rule = options.rule;
        
        this._node.querySelector('.rule-active').checked = rule.active;
        let ruleName = this._node.querySelector('.rule-name');
        ruleName.textContent = rule.name;
        ruleName.dataset.pattern = rule.pattern;
        ruleName.dataset.url = rule.url;
    }
    
    get node () {
        return this._node;
    }

    release () {
        this._node.querySelector('.edit-button').removeEventListener('click,', this._editRule);
        this._node.querySelector('.delete-button').removeEventListener('click', this._deleteRule);
    }
}


class RulesManager {
    _dragStart (event) {
        event.currentTarget.style.opacity = '0.4';
        
        event.dataTransfer.setData('text', event.currentTarget.rowIndex.toString());
        event.dataTransfer.effectAllowed = 'move';
    }
    _dragEnter (event) {
        if (event.currentTarget.rowIndex != event.dataTransfer.getData('text')) {
            event.currentTarget.querySelector('.settings-rule').classList.add('dragover');
        }
    }
    _dragLeave (event) {
        let currentElement = document.elementFromPoint(event.pageX, event.pageY);
        if (!event.currentTarget.contains(currentElement)) {
			event.currentTarget.querySelector('.settings-rule').classList.remove('dragover');
        }
    }
    _dragOver (event) {
        if (event.currentTarget.rowIndex != event.dataTransfer.getData('text')) {
            event.preventDefault(); // Necessary. Allows us to drop.
        
            event.dataTransfer.dropEffect = 'move';
        }
        else
            event.dataTransfer.dropEffect = 'none';
        
        return false;
    }
    _dragEnd (event) {
        for (let row of this._table.rows) {
            row.style.opacity = '';
            row.querySelector('.settings-rule').classList.remove('dragover');
        }
    }
    _drop (event) {
        event.stopPropagation(); // stops the browser from redirecting.
        event.preventDefault();

        this.moveRow(event.dataTransfer.getData('text'), event.currentTarget.rowIndex);
        
        return false;
    }
    
    _ruleEdited (rule) {
        if (this._onChange) this._onChange();
    }
    _ruleDeleted (rule) {
        // look-up row from CustomRule
        let entries = Array.from(this._rows.entries()).filter(entry => entry[1] === rule);
        
        this.deleteRow(entries[0][0].rowIndex);

        if (this._onChange) this._onChange();
    }

    constructor (options) {
        let {id, rules, display} = options;

        this._rows = new Map();

        this._container = $(id);
        this._table =  this._container.querySelector('.rules-table');
        
        display ? this.show() : this.hide();

        this._onChange = options.onChange;

        if (rules) {
            for (let rule of rules) {
                this.insertRow(-1, {rule: rule,
                                    onEdit: this._ruleEdited.bind(this),
                                    onDelete: this._ruleDeleted.bind(this)});
            }
        }

        // handle drag n' drop on rules overflow area
        function dragOverOverflow (event) {
            if (event.dataTransfer.getData('text') < (this._table.rows.length-1)) {
                event.preventDefault(); // Necessary. Allows us to drop.
        
                event.dataTransfer.dropEffect = 'move';
            }
            else
                event.dataTransfer.dropEffect = 'none';
        }
        function dropOverflow (event) {
            event.stopPropagation(); // stops the browser from redirecting.
            event.preventDefault();

            this.moveRow(event.dataTransfer.getData('text'), -1);

            return false;
        }
        let rulesArea = this._container.querySelector('.overflow');
        rulesArea.addEventListener('dragover', dragOverOverflow.bind(this));
        rulesArea.addEventListener('drop', dropOverflow.bind(this));
    }

    insertRow (index, options) {
        let rule = new CustomRule(options);
        let row = this._table.insertRow(index);

        this._rows.set(row, rule);
        
        // Drag n drop management
        row.addEventListener('dragstart', this._dragStart.bind(this));
        row.addEventListener('dragenter', this._dragEnter.bind(this));
        row.addEventListener('dragover', this._dragOver.bind(this));
        row.addEventListener('dragleave', this._dragLeave.bind(this));
        row.addEventListener('dragend', this._dragEnd.bind(this));
        row.addEventListener('drop', this._drop.bind(this));
        
        row.insertCell(0).appendChild(rule.node);

        return row;
    }

    updateRow (index, options) {
        let row = this._table.rows[index];
        let rule = this._rows.get(row);

        rule.update(options);

        return row;
    }

    moveRow (source,  target) {
        let sourceRow = this._table.rows[source];
        let rule = this._rows.get(sourceRow);
        
        this._table.deleteRow(source);
        this._rows.delete(sourceRow);

        let targetRow = this._table.insertRow(target);
        this._rows.set(targetRow, rule);

        targetRow.addEventListener('dragstart', this._dragStart.bind(this));
        targetRow.addEventListener('dragenter', this._dragEnter.bind(this));
        targetRow.addEventListener('dragover', this._dragOver.bind(this));
        targetRow.addEventListener('dragleave', this._dragLeave.bind(this));
        targetRow.addEventListener('dragend', this._dragEnd.bind(this));
        targetRow.addEventListener('drop', this._drop.bind(this));

        targetRow.insertCell(0).appendChild(rule.node);

        if (this._onChange) this._onChange();
    }
    
    deleteRow (index) {
        let row = this._table.rows[index];
        
        // remove handlers
        row.removeEventListener('dragstart', this._dragStart.bind(this));
        row.removeEventListener('dragenter', this._dragEnter.bind(this));
        row.removeEventListener('dragover', this._dragOver.bind(this));
        row.removeEventListener('dragleave', this._dragLeave.bind(this));
        row.removeEventListener('dragend', this._dragEnd.bind(this));
        row.removeEventListener('drop', this._drop.bind(this));

        let rule = this._rows.get(row);
        rule.release();
        this._rows.delete(row);
        
        this._table.deleteRow(index);

        if (this._onChange) this._onChange();
    }

    update (rules) {
        let size = this._table.rows.length;
        let index = 0;
        
        for (let rule of rules) {
            if (index < size) {
                this.updateRow(index, {rule: rule,
                                       onEdit: this._ruleEdited.bind(this),
                                       onDelete: this._ruleDeleted.bind(this)});
                index++;
            } else {
                this.insertRow(-1, {rule: rule,
                                    onEdit: this._ruleEdited.bind(this),
                                    onDelete: this._ruleDeleted.bind(this)});
            }
        }

        // remove obsolete rows
        for (let i = index; index < size; i++) {
            this.deleteRow(i);
        }
    }
    
    addRule () {
        function appendRule (event, rule) {
            rule.active = true;
            this.insertRow(-1, {rule: rule,
                                onEdit: this._ruleEdited.bind(this), 
                                onDelete: this._ruleDeleted.bind(this)});

            if (this._onChange) this._onChange();
        }
        
        ruleEditor.newRule({onOK: appendRule.bind(this)});
    }

    get rules () {
        let result = [];

        for (let i = 0, rows = this._table.rows; i < rows.length; i++) {
            let cell = rows[i].cells[0];
            let rule = cell.querySelector('.rule-name');
            let checked = cell.querySelector('.rule-active').checked;
            
            result.push({name: rule.textContent,
                         pattern: rule.dataset.pattern,
                         url: rule.dataset.url,
                         active: checked});
        }
        
        return result;
    }
    
    show () {
        this._container.classList.remove('hidden');
    }
    hide () {
        this._container.classList.add('hidden');
    }
}
