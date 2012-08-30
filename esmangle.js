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
/*global esmangle:true, exports:true*/

(function (factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // and plain browser loading,
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else if (typeof window !== 'undefined') {
        factory((window.esmangle = {}));
    } else {
        factory((Function('return this')().esmangle = {}));
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
    VERSION = '0.0.1-dev';

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
        function deepCopyInernal(obj, result) {
            var key, val, result;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    val = obj[key];
                    if (typeof val === 'object' && val !== null) {
                        val = deepCopyInernal(val, isArray(val) ? [] : {});
                    }
                    result[key] = val;
                }
            }
            return result;
        }
        return deepCopyInernal(obj, isArray(obj) ? [] : {});
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

        if (strict && isStrictModeReservedWord(id)) {
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

    NameSequence = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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
    }

    function Variable(ident) {
        this.name = ident.name;
        this.identifiers = [ ident ];
        this.references = [];
    }

    function Scope(block, upper, opt) {
        this.type =
            (block.type === 'CatchCaluse') ? 'catch' :
            (block.type === 'WithStatement') ? 'with' :
            (block.type === 'Program') ? 'global' : 'function';
        this.set = {};
        this.names = [];
        this.tip = 'a';
        this.dynamic = this.type === 'global' || this.type === 'with';
        this.block = block;
        this.throgh = [];
        this.variables = [];
        this.references = [];
        this.left = [];
        this.variableScope =
            (this.type === 'global' || this.type === 'function') ? this : upper.variableScope;
        this.block.$scope = this;

        // RAII
        this.upper = scope;
        scope = this;
        scopes.push(this);
    }

    Scope.prototype.close = function close() {
        var i, iz, ref;

        console.log('variables ', this.variables);
        console.log('references', this.references);

        // Because if this is global environment, upper is null
        if (!this.dynamic) {
            // static resolve
            for (i = 0, iz = this.left.length; i < iz; ++i) {
                ref = this.left[i];
                if (!this.resolve(ref)) {
                    this.upper.delegateLeft(ref);
                }
            }
        } else {
            // this is global / with / function with eval environment
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
            ref.resolved = variable;
            return true;
        }
        return false;
    };

    Scope.prototype.delegateLeft = function delegateLeft(ref) {
        this.left.push(ref);
    };

    Scope.prototype.passAsUnique = function passAsUnique(name) {
        var i, len, ref;
        if (isKeyword(name)) {
            return false;
        }
        for (i = 0, len = this.throgh.len; i < len; ++i) {
            ref = this.throgh[i];
            if (ref.name === name) {
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

    Scope.prototype.register = function register(name) {

    };

    Scope.prototype.define = function define(node) {
        var name, variable;
        if (node && node.type === Syntax.Identifier) {
            name = node.name;
            if (!this.set.hasOwnProperty(name)) {
                variable = new Variable(node);
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
        this.dynamic = true;
    };

    Scope.prototype.mangle = function mangle() {
    };

    // detach from tree
    Scope.prototype.detach = function detach() {
        delete this.block.$scope;
    };

    Scope.isRequired = function isRequired(node) {
        return node.type === 'Program' || node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'WithStatement' || node.type === 'CatchCaluse';
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

        scopes = [];
        scope = null;

        result = deepCopy(tree);

        // attach scope and collect / resolve names
        traverse(result, {
            enter: function enter(node) {
                var i, iz;
                if (Scope.isRequired(node)) {
                    new Scope(node, scope, {});
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
                    break;

                case Syntax.FunctionExpression:
                    // FunctionExpression name isn't defined in upper scope
                    scope.define(node.id);
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
                if (scope && node === scope.block) {
                    scope.close();
                }
            }
        });

        // mangling names
        for (i = 0, len = scopes.length; i < len; ++i) {
            scopes[i].mangle();
        }

        // cleanup scopes
        for (i = 0, len = scopes.length; i < len; ++i) {
            scopes[i].detach();
        }

        return result;
    }

    exports.version = VERSION;
    exports.generateNextName = generateNextName;
    exports.mangle = mangle;
}));
/* vim: set sw=4 ts=4 et tw=80 : */
