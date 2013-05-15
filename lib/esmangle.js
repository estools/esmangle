/*
  Copyright (C) 2012-2013 Yusuke Suzuki <utatane.tea@gmail.com>

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
/*global exports:true*/

(function () {
    'use strict';

    var escope,
        common,
        Options,
        Syntax,
        Map,
        annotateDirective;

    escope = require('escope');
    common = require('./common');
    Options = require('./options');
    Map = require('./map');
    annotateDirective = require('./annotate-directive');
    Syntax = common.Syntax;

    // simple visitor implementation

    function passAsUnique(scope, name) {
        var i, iz;
        if (common.isKeyword(name) || common.isRestrictedWord(name)) {
            return false;
        }
        if (scope.taints.has(name)) {
            return false;
        }
        for (i = 0, iz = scope.through.length; i < iz; ++i) {
            if (scope.through[i].identifier.name === name) {
                return false;
            }
        }
        return true;
    }

    function generateName(scope, tip) {
        do {
            tip = common.generateNextName(tip);
        } while (!passAsUnique(scope, tip));
        return tip;
    }

    function run(scope) {
        var i, iz, j, jz, variable, name, def, ref;

        if (scope.isStatic()) {
            name = '9';

            scope.variables.sort(function (a, b) {
                if (a.tainted) {
                    return 1;
                }
                if (b.tainted) {
                    return -1;
                }
                return (b.identifiers.length + b.references.length) - (a.identifiers.length + a.references.length);
            });

            for (i = 0, iz = scope.variables.length; i < iz; ++i) {
                variable = scope.variables[i];

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

                name = generateName(scope, name);

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
    }

    function Label(node, upper) {
        this.node = node;
        this.upper = upper;
        this.users = [];
        this.names = new Map();
        this.name = null;
    }

    Label.prototype.mangle = function () {
        var tip, current, i, iz;
        tip = '9';

        // merge already used names
        for (current = this.upper; current; current = current.upper) {
            if (current.name !== null) {
                this.names.set(current.name, true);
            }
        }

        do {
            tip = common.generateNextName(tip);
        } while (this.names.has(tip));

        this.name = tip;

        for (current = this.upper; current; current = current.upper) {
            current.names.set(tip, true);
        }

        this.node.label.name = tip;
        for (i = 0, iz = this.users.length; i < iz; ++i) {
            this.users[i].label.name = tip;
        }
    };

    function LabelScope(upper) {
        this.map = new Map();
        this.upper = upper;
        this.label = null;
        this.labels = [];
    }

    LabelScope.prototype.register = function register(node) {
        var name;

        common.assert(node.type === Syntax.LabeledStatement);

        this.label = new Label(node, this.label);
        this.labels.push(this.label);

        name = node.label.name;
        common.assert(!this.map.has(name), 'duplicate label is found');
        this.map.set(name, this.label);
    };

    LabelScope.prototype.unregister = function unregister(node) {
        var name, ref;
        if (node.type !== Syntax.LabeledStatement) {
            return;
        }

        name = node.label.name;
        ref = this.map.get(name);
        this.map['delete'](name);

        this.label = ref.upper;
    };

    LabelScope.prototype.resolve = function resolve(node) {
        var name;
        if (node.label) {
            name = node.label.name;
            common.assert(this.map.has(name), 'unresolved label');
            this.map.get(name).users.push(node);
        }
    };

    LabelScope.prototype.close = function close() {
        var i, iz, label;
        this.labels.sort(function (lhs, rhs) {
            return rhs.users.length - lhs.users.length;
        });

        for (i = 0, iz = this.labels.length; i < iz; ++i) {
            label = this.labels[i];
            label.mangle();
        }

        return this.upper;
    };

    function mangleLabels(tree) {
        var labelScope;

        common.traverse(tree, {
            enter: function (node) {
                if (escope.Scope.isVariableScopeRequired(node)) {
                    labelScope = new LabelScope(labelScope);
                    return;
                }

                switch (node.type) {
                case Syntax.LabeledStatement:
                    labelScope.register(node);
                    break;

                case Syntax.BreakStatement:
                case Syntax.ContinueStatement:
                    labelScope.resolve(node);
                    break;
                }
            },
            leave: function (node) {
                labelScope.unregister(node);
                if (escope.Scope.isVariableScopeRequired(node)) {
                    labelScope = labelScope.close();
                }
            }
        });

        return tree;
    }

    function mangle(tree, options) {
        var result, manager, i, iz;

        options = new Options(options);

        result = (options.get('destructive')) ? tree : common.deepCopy(tree);
        manager = escope.analyze(result, { directive: true });

        // mangling names
        for (i = 0, iz = manager.scopes.length; i < iz; ++i) {
            run(manager.scopes[i]);
        }

        // mangling labels
        return mangleLabels(result);
    }

    // recover some broken AST

    function recover(tree, useDirectiveStatement) {
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

        common.traverse(tree, {
            leave: function leave(node) {
                if (node.type === Syntax.IfStatement && node.alternate) {
                    // force wrap up or not
                    if (node.consequent.type !== Syntax.BlockStatement) {
                        if (trailingIf(node.consequent)) {
                            node.consequent = {
                                type: Syntax.BlockStatement,
                                body: [ node.consequent ]
                            };
                        }
                    }
                }
                if (!useDirectiveStatement && node.type === Syntax.DirectiveStatement) {
                    node.type = Syntax.ExpressionStatement;
                    node.expression = common.moveLocation(node, {
                        type: Syntax.Literal,
                        value: node.value,
                        raw: node.raw
                    });
                    delete node.directive;
                    delete node.value;
                    delete node.raw;
                }
            }
        });

        return tree;
    }

    function iteration(tree, p, options) {
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

        result = (options.get('destructive')) ? tree : common.deepCopy(tree);

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
                    res = pass(result, options);
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

        return result;
    }

    function optimize(tree, pipeline, options) {
        var i, iz, j, jz, section, pass;

        tree = annotateDirective(tree, new Options({ destructive: false }));

        if (null == pipeline) {
            pipeline = [
                [
                    'pass/hoist-variable-to-arguments',
                    'pass/transform-dynamic-to-static-property-access',
                    'pass/transform-dynamic-to-static-property-definition',
                    'pass/transform-immediate-function-call',
                    'pass/transform-logical-association',
                    'pass/reordering-function-declarations',
                    'pass/remove-unused-label',
                    'pass/remove-empty-statement',
                    'pass/remove-wasted-blocks',
                    'pass/transform-to-compound-assignment',
                    'pass/transform-to-sequence-expression',
                    'pass/transform-branch-to-expression',
                    'pass/transform-typeof-undefined',
                    'pass/reduce-sequence-expression',
                    'pass/reduce-branch-jump',
                    'pass/reduce-multiple-if-statements',
                    'pass/dead-code-elimination',
                    'pass/remove-side-effect-free-expressions',
                    'pass/remove-context-sensitive-expressions',
                    'pass/tree-based-constant-folding',
                    'pass/concatenate-variable-definition',
                    'pass/drop-variable-definition',
                    'pass/remove-unreachable-branch'
                ].map(esmangle_require),
                {
                    once: true,
                    pass: [
                        'post/transform-static-to-dynamic-property-access',
                        'post/transform-infinity',
                        'post/rewrite-boolean',
                        'post/rewrite-conditional-expression',
                        'post/omit-parens-in-void-context-iife'
                    ].map(esmangle_require)
                }
            ];
        }

        options = new Options(options);

        for (i = 0, iz = pipeline.length; i < iz; ++i) {
            section = pipeline[i];
            // simple iterative pass
            if (common.Array.isArray(section)) {
                tree = iteration(tree, section, options);
            } else if (section.once) {
                pass = section.pass;
                for (j = 0, jz = pass.length; j < jz; ++j) {
                    tree = pass[j](tree, options).result;
                }
            }
        }

        return recover(tree, options.get('directive'));
    }

    function esmangle_require() {
        var args = ['./' + arguments[0]].concat([].slice.call(arguments, 1));
        return require.apply(null, args);
    }

    exports.version = require('../package.json').version;
    exports.mangle = mangle;
    exports.optimize = optimize;
    exports.require = esmangle_require;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
