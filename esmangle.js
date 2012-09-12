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
        define('esmangle', ['exports', 'esmangle/common', 'escope'], function(exports, common, escope) {
            factory(exports, common, escope);
        });
    } else if (typeof exports !== 'undefined') {
        exports.common = require('./lib/common');
        factory(exports, exports.common, require('escope'));
    } else {
        factory(namespace('esmangle', global), namespace('esmangle.common', global), namespace('escope', global));
    }
}(function (exports, common, escope) {
    'use strict';

    var VERSION,
        Syntax;

    // Sync with package.json.
    VERSION = '0.0.6-dev';

    Syntax = common.Syntax;

    // simple visitor implementation

    function passAsUnique(scope, name) {
        var i, iz;
        if (common.isKeyword(name) || common.isRestrictedWord(name)) {
            return false;
        }
        if (scope.taints.hasOwnProperty(name)) {
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

    function mangle(tree, options) {
        var result, manager, i, iz;

        if (options == null) {
            options = { destructive: false };
        }

        result = (options.destructive) ? tree : common.deepCopy(tree);
        manager = escope.analyze(result);

        // mangling names
        for (i = 0, iz = manager.scopes.length; i < iz; ++i) {
            run(manager.scopes[i]);
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
