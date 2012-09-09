/*
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint bitwise:true */
/*global esmangle:true, exports:true, define:true*/

(function (factory, global) {
    'use strict';

    function namespace(str, obj) {
        var i, iz, names, name;
        names = str.split('.');
        for (i = 0, iz = names.length; i < iz; ++i) {
            name = names[i];
            if (obj.hasOwnProperty(name)) {
                obj = obj[name];
            } else {
                obj = (obj[name] = {});
            }
        }
        return obj;
    }

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // and plain browser loading,
    if (typeof define === 'function' && define.amd) {
        define('esmangle', ['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory(namespace('esmangle', global));
    }
}(function (exports) {
    'use strict';

    var VERSION,
        Syntax,
        NameSequence,
        ZeroSequenceCache,
        VisitorOption,
        VisitorKeys,
        isArray,
        scopes,
        scope;

    // Sync with package.json.
    VERSION = '0.0.4-dev';

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };
    }

    function assert(cond, text) { }

    if (VERSION.slice(-3) === 'dev') {
        assert = function assert(cond, text) {
            if (!cond) {
                throw new Error(text);
            }
        };
    }

    function deepCopy(obj) {
        function deepCopyInternal(obj, result) {
            var key, val;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    val = obj[key];
                    if (typeof val === 'object' && val !== null) {
                        if (val instanceof RegExp) {
                            val = new RegExp(val);
                        } else {
                            val = deepCopyInternal(val, isArray(val) ? [] : {});
                        }
                    }
                    result[key] = val;
                }
            }
            return result;
        }
        return deepCopyInternal(obj, isArray(obj) ? [] : {});
    }

    // 7.6.1.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {

        // Future reserved words.
        case 'class':
        case 'enum':
        case 'export':
        case 'extends':
        case 'import':
        case 'super':
            return true;
        }

        return false;
    }

    function isStrictModeReservedWord(id) {
        switch (id) {

        // Strict Mode reserved words.
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        }

        return false;
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // 7.6.1.1 Keywords

    function isKeyword(id) {
        var keyword = false;
        switch (id.length) {
        case 2:
            keyword = (id === 'if') || (id === 'in') || (id === 'do');
            break;
        case 3:
            keyword = (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
            break;
        case 4:
            keyword = (id === 'this') || (id === 'else') || (id === 'case') || (id === 'void') || (id === 'with');
            break;
        case 5:
            keyword = (id === 'while') || (id === 'break') || (id === 'catch') || (id === 'throw');
            break;
        case 6:
            keyword = (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch');
            break;
        case 7:
            keyword = (id === 'default') || (id === 'finally');
            break;
        case 8:
            keyword = (id === 'function') || (id === 'continue') || (id === 'debugger');
            break;
        case 10:
            keyword = (id === 'instanceof');
            break;
        }

        if (keyword) {
            return true;
        }

        switch (id) {
        // Future reserved words.
        // 'const' is specialized as Keyword in V8.
        case 'const':
            return true;

        // For compatiblity to SpiderMonkey and ES.next
        case 'yield':
        case 'let':
            return true;
        }

        if (isStrictModeReservedWord(id)) {
            return true;
        }

        return isFutureReservedWord(id);
    }

    function stringRepeat(str, num) {
        var result = '';

        for (num |= 0; num > 0; num >>>= 1, str += str) {
            if (num & 1) {
                result += str;
            }
        }

        return result;
    }

    ZeroSequenceCache = [];

    function zeroSequence(num) {
        var res = ZeroSequenceCache[num];
        if (res !== undefined) {
            return res;
        }
        res = stringRepeat('0', num);
        ZeroSequenceCache[num] = res;
        return res;
    }

    NameSequence = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$'.split('');

    function generateNextName(name) {
        var ch, index, cur;

        cur = name.length - 1;
        do {
            ch = name.charAt(cur);
            index = NameSequence.indexOf(ch);
            if (index !== (NameSequence.length - 1)) {
                return name.substring(0, cur) + NameSequence[index + 1] + zeroSequence(name.length - (cur + 1));
            }
            --cur;
        } while (cur >= 0);
        return 'a' + zeroSequence(name.length);
    }

    function Reference(ident) {
        this.identifier = ident;
        this.resolved = null;
        this.tainted = false;
    }

    function Variable(name) {
        this.name = name;
        this.identifiers = [];
        this.references = [];
        this.tainted = false;
    }

    function Scope(block, opt) {
        var variable;

        this.type =
            (block.type === 'CatchClause') ? 'catch' :
            (block.type === 'WithStatement') ? 'with' :
            (block.type === 'Program') ? 'global' : 'function';
        this.set = {};
        this.tip = 'a';
        this.dynamic = this.type === 'global' || this.type === 'with';
        this.block = block;
        this.through = [];
        this.variables = [];
        this.references = [];
        this.taints = {};
        this.left = [];
        this.variableScope =
            (this.type === 'global' || this.type === 'function') ? this : scope.variableScope;

        if (opt.naming) {
            this.define(block.id);
        } else {
            if (this.type === 'function') {
                variable = new Variable('arguments');
                this.taints['arguments'] = true;
                this.set['arguments'] = variable;
                this.variables.push(variable);
            }

            if (block.type === 'FunctionExpression' && block.id) {
                new Scope(block, { naming: true });
            }
        }

        // RAII
        this.upper = scope;
        scope = this;
        scopes.push(this);
    }

    Scope.prototype.close = function close() {
        var i, iz, ref, set, current;

        // Because if this is global environment, upper is null
        if (!this.dynamic) {
            // static resolve
            for (i = 0, iz = this.left.length; i < iz; ++i) {
                ref = this.left[i];
                if (!this.resolve(ref)) {
                    this.delegateToUpperScope(ref);
                }
            }
        } else {
            // this is global / with / function with eval environment
            if (this.type === 'with') {
                for (i = 0, iz = this.left.length; i < iz; ++i) {
                    ref = this.left[i];
                    ref.tainted = true;
                    this.delegateToUpperScope(ref);
                }
            } else {
                for (i = 0, iz = this.left.length; i < iz; ++i) {
                    // notify all names are through to global
                    ref = this.left[i];
                    current = this;
                    do {
                        current.through.push(ref);
                        current = current.upper;
                    } while (current);
                }
            }
        }
        this.left = null;

        scope = this.upper;
    };

    Scope.prototype.resolve = function resolve(ref) {
        var i, iz, variable, name;
        name = ref.identifier.name;
        if (this.set.hasOwnProperty(name)) {
            variable = this.set[name];
            variable.references.push(ref);
            if (ref.tainted) {
                variable.tainted = true;
                this.taints[variable.name] = true;
            }
            ref.resolved = variable;
            return true;
        }
        return false;
    };

    Scope.prototype.delegateToUpperScope = function delegateToUpperScope(ref) {
        assert(this.upper, 'upper should be here');
        this.upper.left.push(ref);
        this.through.push(ref);
    };

    Scope.prototype.passAsUnique = function passAsUnique(name) {
        var i, iz;
        if (name === 'eval' || name === 'arguments') {
            return false;
        }
        if (isKeyword(name)) {
            return false;
        }
        if (this.taints.hasOwnProperty(name)) {
            return false;
        }
        for (i = 0, iz = this.through.length; i < iz; ++i) {
            if (this.through[i].identifier.name === name) {
                return false;
            }
        }
        return true;
    };

    Scope.prototype.generateName = function generateName() {
        var result;
        while (!this.passAsUnique(this.tip)) {
            this.tip = generateNextName(this.tip);
        }
        result = this.tip;
        this.tip = generateNextName(this.tip);
        return result;
    };

    Scope.prototype.define = function define(node) {
        var name, variable;
        if (node && node.type === Syntax.Identifier) {
            name = node.name;
            if (!this.set.hasOwnProperty(name)) {
                variable = new Variable(name);
                variable.identifiers.push(node);
                this.set[name] = variable;
                this.variables.push(variable);
            } else {
                variable = this.set[name];
                variable.identifiers.push(node);
            }
        }
    };

    Scope.prototype.referencing = function referencing(node) {
        var ref;

        // because Array element may be null
        if (node && node.type === Syntax.Identifier) {
            ref = new Reference(node);
            this.references.push(ref);
            this.left.push(ref);
        }
    };

    Scope.prototype.detectEval = function detectEval() {
        var current;
        current = this;
        do {
            current.dynamic = true;
            current = current.upper;
        } while (current);
    };

    Scope.prototype.mangle = function mangle() {
        var i, iz, j, jz, variable, name, def, ref;
        if (!this.dynamic) {
            this.variables.sort(function (a, b) {
                if (a.tainted) {
                    return 1;
                }
                if (b.tainted) {
                    return -1;
                }
                return (b.identifiers.length + b.references.length) - (a.identifiers.length + a.references.length);
            });
            for (i = 0, iz = this.variables.length; i < iz; ++i) {
                variable = this.variables[i];

                if (variable.tainted) {
                    continue;
                }

                // Because `arguments` definition is nothing.
                // But if `var arguments` is defined, identifiers.length !== 0
                // and this doesn't indicate arguments.
                if (variable.identifiers.length === 0) {
                    // do not change names because this is special name
                    continue;
                }

                name = this.generateName();

                for (j = 0, jz = variable.identifiers.length; j < jz; ++j) {
                    def = variable.identifiers[j];
                    // change definition's name
                    def.name = name;
                }

                for (j = 0, jz = variable.references.length; j < jz; ++j) {
                    ref = variable.references[j];
                    // change reference's name
                    ref.identifier.name = name;
                }
            }
        }
    };

    Scope.isRequired = function isRequired(node) {
        return node.type === 'Program' || node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'WithStatement' || node.type === 'CatchClause';
    };

    // simple visitor implementation

    VisitorKeys = {
        AssignmentExpression: ['left', 'right'],
        ArrayExpression: ['elements'],
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DoWhileStatement: ['body', 'test'],
        DebuggerStatement: [],
        EmptyStatement: [],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SwitchStatement: ['descriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handlers', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body']
    };

    VisitorOption = {
        Break: 1,
        Skip: 2
    };

    function traverse(top, visitor) {
        var worklist, leavelist, node, ret, current, current2, candidates, candidate;

        worklist = [ top ];
        leavelist = [];

        while (worklist.length) {
            node = worklist.pop();

            if (node) {
                if (visitor.enter) {
                    ret = visitor.enter(node);
                } else {
                    ret = undefined;
                }

                if (ret === VisitorOption.Break) {
                    return;
                }

                worklist.push(null);
                leavelist.push(node);

                if (ret !== VisitorOption.Skip) {
                    candidates = VisitorKeys[node.type];
                    current = candidates.length;
                    while ((current -= 1) >= 0) {
                        candidate = node[candidates[current]];
                        if (candidate) {
                            if (isArray(candidate)) {
                                current2 = candidate.length;
                                while ((current2 -= 1) >= 0) {
                                    if (candidate[current2]) {
                                        worklist.push(candidate[current2]);
                                    }
                                }
                            } else {
                                worklist.push(candidate);
                            }
                        }
                    }
                }
            } else {
                node = leavelist.pop();
                if (visitor.leave) {
                    ret = visitor.leave(node);
                } else {
                    ret = undefined;
                }
                if (ret === VisitorOption.Break) {
                    return;
                }
            }
        }
    }

    function mangle(tree, options) {
        var result, i, len;

        if (options == null) {
            options = { destructive: false };
        }

        if (options.destructive) {
            result = tree;
        } else {
            result = deepCopy(tree);
        }

        scopes = [];
        scope = null;

        // attach scope and collect / resolve names
        traverse(result, {
            enter: function enter(node) {
                var i, iz;
                if (Scope.isRequired(node)) {
                    new Scope(node, {});
                }

                switch (node.type) {
                case Syntax.AssignmentExpression:
                    scope.referencing(node.left);
                    scope.referencing(node.right);
                    break;

                case Syntax.ArrayExpression:
                    for (i = 0, iz = node.elements.length; i < iz; ++i) {
                        scope.referencing(node.elements[i]);
                    }
                    break;

                case Syntax.BlockStatement:
                    break;

                case Syntax.BinaryExpression:
                    scope.referencing(node.left);
                    scope.referencing(node.right);
                    break;

                case Syntax.BreakStatement:
                    break;

                case Syntax.CallExpression:
                    scope.referencing(node.callee);
                    for (i = 0, iz = node['arguments'].length; i < iz; ++i) {
                        scope.referencing(node['arguments'][i]);
                    }

                    // check this is direct call to eval
                    if (node.callee.type === Syntax.Identifier && node.callee.name === 'eval') {
                        scope.variableScope.detectEval();
                    }
                    break;

                case Syntax.CatchClause:
                    scope.define(node.param);
                    break;

                case Syntax.ConditionalExpression:
                    scope.referencing(node.test);
                    scope.referencing(node.consequent);
                    scope.referencing(node.alternate);
                    break;

                case Syntax.ContinueStatement:
                    break;

                case Syntax.DoWhileStatement:
                    scope.referencing(node.test);
                    break;

                case Syntax.DebuggerStatement:
                    break;

                case Syntax.EmptyStatement:
                    break;

                case Syntax.ExpressionStatement:
                    scope.referencing(node.expression);
                    break;

                case Syntax.ForStatement:
                    scope.referencing(node.init);
                    scope.referencing(node.test);
                    scope.referencing(node.update);
                    break;

                case Syntax.ForInStatement:
                    scope.referencing(node.left);
                    scope.referencing(node.right);
                    break;

                case Syntax.FunctionDeclaration:
                    // FunctionDeclaration name is defined in upper scope
                    scope.upper.define(node.id);
                    for (i = 0, iz = node.params.length; i < iz; ++i) {
                        scope.define(node.params[i]);
                    }
                    break;

                case Syntax.FunctionExpression:
                    // id is defined in upper scope
                    for (i = 0, iz = node.params.length; i < iz; ++i) {
                        scope.define(node.params[i]);
                    }
                    break;

                case Syntax.Identifier:
                    break;

                case Syntax.IfStatement:
                    scope.referencing(node.test);
                    break;

                case Syntax.Literal:
                    break;

                case Syntax.LabeledStatement:
                    break;

                case Syntax.LogicalExpression:
                    scope.referencing(node.left);
                    scope.referencing(node.right);
                    break;

                case Syntax.MemberExpression:
                    scope.referencing(node.object);
                    if (node.computed) {
                        scope.referencing(node.property);
                    }
                    break;

                case Syntax.NewExpression:
                    scope.referencing(node.callee);
                    for (i = 0, iz = node['arguments'].length; i < iz; ++i) {
                        scope.referencing(node['arguments'][i]);
                    }
                    break;

                case Syntax.ObjectExpression:
                    break;

                case Syntax.Program:
                    break;

                case Syntax.Property:
                    scope.referencing(node.value);
                    break;

                case Syntax.ReturnStatement:
                    scope.referencing(node.argument);
                    break;

                case Syntax.SequenceExpression:
                    for (i = 0, iz = node.expressions.length; i < iz; ++i) {
                        scope.referencing(node.expressions[i]);
                    }
                    break;

                case Syntax.SwitchStatement:
                    scope.referencing(node.descriminant);
                    break;

                case Syntax.SwitchCase:
                    scope.referencing(node.test);
                    break;

                case Syntax.ThisExpression:
                    break;

                case Syntax.ThrowStatement:
                    scope.referencing(node.argument);
                    break;

                case Syntax.TryStatement:
                    break;

                case Syntax.UnaryExpression:
                    scope.referencing(node.argument);
                    break;

                case Syntax.UpdateExpression:
                    scope.referencing(node.argument);
                    break;

                case Syntax.VariableDeclaration:
                    break;

                case Syntax.VariableDeclarator:
                    scope.variableScope.define(node.id);
                    scope.referencing(node.init);
                    break;

                case Syntax.WhileStatement:
                    scope.referencing(node.test);
                    break;

                case Syntax.WithStatement:
                    scope.referencing(node.object);
                    break;
                }
            },

            leave: function leave(node) {
                while (scope && node === scope.block) {
                    scope.close();
                }
            }
        });

        assert(scope === null);

        // mangling names
        for (i = 0, len = scopes.length; i < len; ++i) {
            scopes[i].mangle();
        }

        return result;
    }

    // recover some broken AST

    function recover(tree) {
        function trailingIf(node) {
            while (true) {
                switch (node.type) {
                case Syntax.IfStatement:
                    if (!node.alternate) {
                        return true;
                    }
                    node = node.alternate;
                    continue;

                case Syntax.LabeledStatement:
                case Syntax.ForStatement:
                case Syntax.ForInStatement:
                case Syntax.WhileStatement:
                case Syntax.WithStatement:
                    node = node.body;
                    continue;
                }
                return false;
            }
        }

        function wrap(node) {
            if (node.type === Syntax.BlockStatement) {
                return node;
            }

            if (trailingIf(node)) {
                return {
                    type: Syntax.BlockStatement,
                    body: [ node ]
                };
            }
            return node;
        }

        traverse(tree, {
            leave: function leave(node) {
                if (node.type === Syntax.IfStatement && node.alternate) {
                    // force wrap up or not
                    node.consequent = wrap(node.consequent);
                }
            }
        });

        return tree;
    }

    function optimize(tree, p, options) {
        var i, iz, pass, res, changed, statuses, passes, result;

        function addPass(pass) {
            var name;
            if (typeof pass !== 'function') {
                // automatic lookup pass (esmangle pass format)
                name = Object.keys(pass)[0];
                pass = pass[name];
            }
            if (pass.hasOwnProperty('passName')) {
                name = pass.passName;
            } else {
                name = pass.name;
            }
            passes.push(pass);
            statuses.push(true);
        }

        function fillStatuses(bool) {
            var i, iz;
            for (i = 0, iz = statuses.length; i < iz; ++i) {
                statuses[i] = bool;
            }
        }

        if (options == null) {
            options = { destructive: false };
        }

        if (options.destructive) {
            result = tree;
        } else {
            result = deepCopy(tree);
        }

        statuses = [];
        passes = [];


        for (i = 0, iz = p.length; i < iz; ++i) {
            addPass(p[i]);
        }

        do {
            changed = false;
            for (i = 0, iz = passes.length; i < iz; ++i) {
                pass = passes[i];
                if (statuses[i]) {
                    res = pass(result, { destructive: true });
                    if (res.modified) {
                        changed = true;
                        fillStatuses(true);
                    } else {
                        statuses[i] = false;
                    }
                    result = res.result;
                }
            }
        } while (changed);

        return recover(result);
    }

    exports.version = VERSION;
    exports.generateNextName = generateNextName;
    exports.mangle = mangle;
    exports.optimize = optimize;

    if (typeof exports.pass === 'undefined') {
        exports.pass = {};
    }

    if (typeof process !== 'undefined') {
        // for node.js environment
        exports.require = (function () {
            var fs = require('fs'),
                path = require('path'),
                root = path.join(path.dirname(fs.realpathSync(__filename)));

            return function() {
                var args = Array.prototype.slice.call(arguments);
                args[0] = path.join(root, args[0]);
                return require.apply(this, args);
            };
        }());
    }
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
