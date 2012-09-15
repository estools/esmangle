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
/*global esmangle:true, module:true, define:true, require:true*/
(function (factory, global) {
    'use strict';

    var ex;

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
        define('esmangle/pass/hoist-variable-to-arguments', ['module', 'esmangle/common', 'escope'], function(module, common, escope) {
            module.exports = factory(common, escope);
        });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(require('../common'), require('escope'));
    } else {
        namespace('esmangle.pass', global).hoistVariableToArguments = factory(namespace('esmangle.common', global), namespace('escope', global));
    }
}(function (common, escope) {
    'use strict';

    var Syntax, scope, modified;

    Syntax = common.Syntax;

    function hoist(callee) {
        callee.body = common.replace(callee.body, {
            enter: function (node) {
                var i, iz, j, jz, expressions, declaration, hoisted;
                if (node.type === Syntax.VariableDeclaration && node.kind === 'var') {
                    expressions = [];
                    for (i = 0, iz = node.declarations.length; i < iz; ++i) {
                        declaration = node.declarations[i];
                        if (declaration.id.type !== Syntax.Identifier) {
                            return;
                        }
                        hoisted = false;
                        for (j = 0, jz = callee.params.length; j < jz; ++j) {
                            if (declaration.id.name === callee.params[j].name) {
                                // already hoisted name
                                hoisted = true;
                                break;
                            }
                        }
                        if (!hoisted) {
                            callee.params.push(declaration.id);
                        }
                        if (declaration.init) {
                            expressions.push(common.moveLocation(declaration, {
                                type: Syntax.AssignmentExpression,
                                operator: '=',
                                left: declaration.id,
                                right: declaration.init
                            }));
                        }
                    }
                    modified = true;
                    return common.moveLocation(node, {
                        type: Syntax.ExpressionStatement,
                        expression: common.moveLocation(node, {
                            type: Syntax.SequenceExpression,
                            expressions: expressions
                        })
                    });
                }
            }
        });
    }

    function hoistVariableToArguments(tree, options) {
        var result, scope, manager;

        if (options == null) {
            options = { destructive: false };
        }

        result = (options.destructive) ? tree : common.deepCopy(tree);
        modified = false;
        scope = null;

        manager = escope.analyze(result);
        manager.attach();

        common.traverse(result, {
            enter: function enter(node, parent) {
                var callee;
                if (node.type === Syntax.CallExpression) {
                    callee = node.callee;
                    if (callee.type === Syntax.FunctionExpression && !callee.id && callee.params.length === node['arguments'].length) {
                        scope = manager.acquire(callee);
                        if (!scope.isArgumentsMaterialized()) {
                            // ok, arguments is not used
                            hoist(callee);
                        }
                    }
                }
            }
        });

        manager.detach();

        return {
            result: result,
            modified: modified
        };
    }

    hoistVariableToArguments.passName = 'hoist-variable-to-arguments';
    return hoistVariableToArguments;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
