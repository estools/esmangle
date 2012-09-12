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
        define('esmangle', ['exports', 'esmangle/common'], function(exports, common) {
            factory(exports, common);
        });
    } else if (typeof exports !== 'undefined') {
        exports.common = require('./lib/common');
        factory(exports, exports.common);
    } else {
        factory(namespace('esmangle', global), namespace('esmangle.common', global));
    }
}(function (exports, common) {
    'use strict';

    var VERSION,
        Syntax,
        scopes,
        scope;

    // Sync with package.json.
    VERSION = '0.0.6-dev';

    Syntax = common.Syntax;

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
        common.assert(this.upper, 'upper should be here');
        this.upper.left.push(ref);
        this.through.push(ref);
    };

    Scope.prototype.passAsUnique = function passAsUnique(name) {
        var i, iz;
        if (common.isKeyword(name) || common.isRestrictedWord(name)) {
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
            this.tip = common.generateNextName(this.tip);
        }
        result = this.tip;
        this.tip = common.generateNextName(this.tip);
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

    function mangle(tree, options) {
        var result, i, len;

        if (options == null) {
            options = { destructive: false };
        }

        result = (options.destructive) ? tree : common.deepCopy(tree);

        scopes = [];
        scope = null;

        // attach scope and collect / resolve names
        common.traverse(result, {
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
                    scope.referencing(node.discriminant);
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

        common.assert(scope === null);

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

        common.traverse(tree, {
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

        result = (options.destructive) ? tree : common.deepCopy(tree);

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
