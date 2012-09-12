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
        define('esmangle/pass/transform-branch-to-expression', ['module', 'esmangle/common'], function(module, common) {
            module.exports = factory(common);
        });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(require('../common'));
    } else {
        namespace('esmangle.pass', global).transformBranchToExpression = factory(namespace('esmangle.common', global));
    }
}(function (common) {
    'use strict';

    var Syntax, modified;

    Syntax = common.Syntax;

    function transform(node) {
        if (node.type === Syntax.IfStatement) {
            if (node.alternate) {
                if (node.consequent.type === Syntax.ExpressionStatement && node.alternate.type === Syntax.ExpressionStatement) {
                    // ok, we can reconstruct this to ConditionalExpression
                    modified = true;
                    return common.moveLocation(node, {
                        type: Syntax.ExpressionStatement,
                        expression: common.moveLocation(node, {
                            type: Syntax.ConditionalExpression,
                            test: node.test,
                            consequent: node.consequent.expression,
                            alternate: node.alternate.expression
                        })
                    });
                }
                if (node.consequent.type === Syntax.ReturnStatement && node.consequent.argument !== null && node.alternate.type === Syntax.ReturnStatement && node.alternate.argument !== null) {
                    // pattern:
                    //   if (cond) return a;
                    //   else return b;
                    modified = true;
                    return common.moveLocation(node, {
                        type: Syntax.ReturnStatement,
                        argument: common.moveLocation(node, {
                            type: Syntax.ConditionalExpression,
                            test: node.test,
                            consequent: node.consequent.argument,
                            alternate: node.alternate.argument
                        })
                    });
                }
                if (node.consequent.type === Syntax.ThrowStatement && node.alternate.type === Syntax.ThrowStatement) {
                    // pattern:
                    //   if (cond) throw a;
                    //   else throw b;
                    modified = true;
                    return common.moveLocation(node, {
                        type: Syntax.ThrowStatement,
                        argument: common.moveLocation(node, {
                            type: Syntax.ConditionalExpression,
                            test: node.test,
                            consequent: node.consequent.argument,
                            alternate: node.alternate.argument
                        })
                    });
                }
            } else {
                if (node.consequent.type === Syntax.ExpressionStatement) {
                    // ok, we can reconstruct this to LogicalExpression
                    modified = true;
                    return common.moveLocation(node, {
                        type: Syntax.ExpressionStatement,
                        expression: common.moveLocation(node, {
                            type: Syntax.LogicalExpression,
                            operator: '&&',
                            left: node.test,
                            right: node.consequent.expression
                        })
                    });
                } else if (node.consequent.type === Syntax.EmptyStatement) {
                    // ok, we can reconstruct this to expression statement
                    modified = true;
                    return common.moveLocation(node, {
                        type: Syntax.ExpressionStatement,
                        expression: node.test
                    });
                }
            }
        }
        return node;
    }

    function transformBranchToExpression(tree, options) {
        var result;

        if (options == null) {
            options = { destructive: false };
        }

        if (options.destructive) {
            result = tree;
        } else {
            result = common.deepCopy(tree);
        }

        modified = false;

        common.traverse(result, {
            leave: function leave(node) {
                var i, iz;
                switch (node.type) {
                case Syntax.BlockStatement:
                case Syntax.Program:
                    for (i = 0, iz = node.body.length; i < iz; ++i) {
                        node.body[i] = transform(node.body[i]);
                    }
                    break;

                case Syntax.SwitchCase:
                    for (i = 0, iz = node.consequent.length; i < iz; ++i) {
                        node.consequent[i] = transform(node.consequent[i]);
                    }
                    break;

                case Syntax.IfStatement:
                    node.consequent = transform(node.consequent);
                    if (node.alternate) {
                        node.alternate = transform(node.alternate);
                    }
                    break;

                case Syntax.LabeledStatement:
                case Syntax.DoWhileStatement:
                case Syntax.ForStatement:
                case Syntax.ForInStatement:
                case Syntax.WhileStatement:
                case Syntax.WithStatement:
                    node.body = transform(node.body);
                    break;
                }
            }
        });

        return {
            result: result,
            modified: modified
        };
    }

    transformBranchToExpression.passName = 'transform-branch-to-expression';
    return transformBranchToExpression;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
