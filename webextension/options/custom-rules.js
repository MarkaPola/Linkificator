

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

        this._onDefaultCancel = options.onCancel;
        this._onDefaultOK = options.onOK;
        
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
        
        for (let rule of rules) {
            let r = new CustomRule({rule: rule,
                                    onEdit: this._editRow.bind(this),
                                    onDelete: this._deleteRow.bind(this)});
            this._table.insertRow(-1).insertCell(0).appendChild(r.node);
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
                let old = this._table.rows[index].cells[0].firstChild;
                this._table.rows[index].cells[0].replaceChild(r.node, old);
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

        for (let i = 0, row; row = this._table.rows[i]; i++) {
            for (let j = 0, cell; cell = row.cells[j]; j++) {
                let rule = cell.querySelector('.rule-name');
                let checked = cell.querySelector('.rule-active').checked;
                
                result.push({name: rule.textContent,
                             pattern: rule.dataset.pattern,
                             url: rule.dataset.url,
                             active: checked});
            }
        }
        
        return result;
    }
}
