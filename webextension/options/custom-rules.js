
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
        let onCancel = this._onCancel;
        let onOK = this._onOK;

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
    constructor (options) {
        let {rule, onEdit, onDelete} = options;
        
        // create DOM object tree
        this._node = document.importNode(document.getElementById('custom-rule-template').content, true);
        this._node.querySelector('.rule-active').checked = rule.active;
        let ruleName = this._node.querySelector('.rule-name');
        ruleName.textContent = rule.name;
        ruleName.dataset.pattern = rule.pattern;
        ruleName.dataset.url = rule.url;

        // attach actions for edition/deletion
        this._node.querySelector('.edit-button').addEventListener('click', event => {
            let rule = event.target.parentNode.querySelector('.rule-name');
            
            function updateRule (event, newRule) {
                rule.textContent = newRule.name;
                rule.dataset.pattern = newRule.pattern;
                rule.dataset.url = newRule.url;

                if (onEdit) onEdit(event.target.parentNode);
            }
            
            ruleEditor.editRule({rule: {name: rule.textContent,
                                        pattern: rule.dataset.pattern,
                                        url: rule.dataset.url},
                                 onOK: updateRule.bind(this)
                                });
        });

        function deleteNode (event) {
            if (onDelete) onDelete(event.target.parentNode);
        }
        this._node.querySelector('.delete-button').addEventListener('click', deleteNode.bind(this));
    }

    get node () {
        return this._node;
    }
}

class RulesManager {
    _editRow (node) {
        if (this._onChange) this._onChange();
    }
    _deleteRow (node) {
        this._table.deleteRow(node.parentNode.parentNode.rowIndex);

        if (this._onChange) this._onChange();
    }
        
    constructor (options) {
        let {id, rules, display} = options;

        this._table = $(id);
        display ? this.show() : this.hide();

        this._onChange = options.onChange;

        if (rules) {
            for (let rule of rules) {
                let r = new CustomRule({rule: rule,
                                        onEdit: this._editRow.bind(this),
                                        onDelete: this._deleteRow.bind(this)});
                this._table.insertRow(-1).insertCell(0).appendChild(r.node);
            }
        }
    }
    
    show () {
        this._table.classList.remove('hidden');
    }
    hide () {
        this._table.classList.add('hidden');
    }

    update (rules) {
        let size = this._table.rows.length;
        let index = 0;
        
        for (let rule of rules) {
            let r = new CustomRule({rule: rule,
                                    onEdit: this._editRow.bind(this),
                                    onDelete: this._deleteRow.bind(this)});
            if (index < size) {
                // update current row
                let cell = this._table.rows[index].cells[0];
                cell.replaceChild(r.node, cell.querySelector('.settings-rule'));
                index++;
            } else {
                this._table.insertRow(-1).insertCell(0).appendChild(r.node);
            }
        }

        // remove obsolete rows
        for (let i = index; index < size; i++) {
            this._table.deleteRow(i);
        }
    }
    
    addRule () {
        function appendRule (event, rule) {
            rule.active = true;
            let r = new CustomRule({rule: rule,
                                    onEdit: this._editRow.bind(this), 
                                    onDelete: this._deleteRow.bind(this)});
            this._table.insertRow(-1).insertCell(0).appendChild(r.node);

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
}
