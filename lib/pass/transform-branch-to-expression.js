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
/*global esmangle:true, exports:true, define:true, require:true*/
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
        define('esmangle/pass/transform-branch-to-expression', ['exports', 'esmangle/common'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports, require('../common'));
    } else {
        factory(namespace('esmangle.pass', global), namespace('esmangle.common', global));
    }
}(function (exports, common) {
    'use strict';

    var Syntax, traverse, deepCopy, modified;

    Syntax = common.Syntax;
    traverse = common.traverse;
    deepCopy = common.deepCopy;

    function transform(node) {
        if (node.type === Syntax.IfStatement) {
            if (node.alternate) {
                if (node.consequent.type === Syntax.ExpressionStatement && node.alternate.type === Syntax.ExpressionStatement) {
                    // ok, we can reconstruct this to ConditionalExpression
                    return {
                        type: Syntax.ExpressionStatement,
                        expression: {
                            type: Syntax.ConditionalExpression,
                            test: node.test,
                            consequent: node.consequent.expression,
                            alternate: node.alternate.expression
                        }
                    };
                }
            } else {
                if (node.consequent.type === Syntax.ExpressionStatement) {
                    // ok, we can reconstruct this to LogicalExpression
                    return {
                        type: Syntax.ExpressionStatement,
                        expression: {
                            type: Syntax.LogicalExpression,
                            operator: '&&',
                            left: node.test,
                            right: node.consequent.expression
                        }
                    };
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
            result = deepCopy(tree);
        }

        modified = false;

        traverse(result, {
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

    transformBranchToExpression.passName = 'transformBranchToExpression';
    exports.transformBranchToExpression = transformBranchToExpression;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
