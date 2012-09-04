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
        define('esmangle/post/rewite-boolean', ['module', 'esmangle/common'], function(module, common) {
            module.exports = factory(common);
        });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(require('../common'));
    } else {
        namespace('esmangle.post', global).rewriteBoolean = factory(namespace('esmangle.common', global));
    }
}(function (common) {
    'use strict';

    var Syntax, traverse, deepCopy;

    Syntax = common.Syntax;
    traverse = common.traverse;
    deepCopy = common.deepCopy;

    function rewrite(node) {
        if (node && node.type === Syntax.Literal && typeof node.value === 'boolean') {
            return {
                type: Syntax.UnaryExpression,
                operator: '!',
                argument: {
                    type: Syntax.Literal,
                    value: +!node.value
                }
            };
        }
        return node;
    }

    function rewriteBoolean(tree, options) {
        var result;

        if (options == null) {
            options = { destructive: false };
        }

        if (options.destructive) {
            result = tree;
        } else {
            result = deepCopy(tree);
        }

        traverse(result, {
            enter: function enter(node) {
                var i, iz;
                switch (node.type) {
                case Syntax.AssignmentExpression:
                case Syntax.BinaryExpression:
                case Syntax.LogicalExpression:
                    node.left = rewrite(node.left);
                    node.right = rewrite(node.right);
                    break;

                case Syntax.ArrayExpression:
                    for (i = 0, iz = node.elements.length; i < iz; ++i) {
                        node.elements[i] = rewrite(node.elements[i]);
                    }
                    break;

                case Syntax.CallExpression:
                case Syntax.NewExpression:
                    node.callee = rewrite(node.callee);
                    for (i = 0, iz = node['arguments'].length; i < iz; ++i) {
                        node['arguments'][i] = rewrite(node['arguments'][i]);
                    }
                    break;

                case Syntax.ConditionalExpression:
                    node.test = rewrite(node.test);
                    node.consequent = rewrite(node.consequent);
                    node.alternate = rewrite(node.alternate);
                    break;

                case Syntax.DoWhileStatement:
                    node.test = rewrite(node.test);
                    break;

                case Syntax.ExpressionStatement:
                    node.expression = rewrite(node.expression);
                    break;

                case Syntax.ForStatement:
                    node.init = rewrite(node.init);
                    node.test = rewrite(node.test);
                    node.update = rewrite(node.update);
                    break;

                case Syntax.ForInStatement:
                    node.left = rewrite(node.left);
                    node.right = rewrite(node.right);
                    break;

                case Syntax.IfStatement:
                    node.test = rewrite(node.test);
                    break;

                case Syntax.MemberExpression:
                    node.object = rewrite(node.object);
                    if (node.computed) {
                        node.property = rewrite(node.property);
                    }
                    break;

                case Syntax.Property:
                    node.value = rewrite(node.value);
                    break;

                case Syntax.ReturnStatement:
                    node.argument = rewrite(node.argument);
                    break;

                case Syntax.SequenceExpression:
                    for (i = 0, iz = node.expressions.length; i < iz; ++i) {
                        node.expressions[i] = rewrite(node.expressions[i]);
                    }
                    break;

                case Syntax.SwitchStatement:
                    node.descriminant = rewrite(node.descriminant);
                    break;

                case Syntax.SwitchCase:
                    node.test = rewrite(node.test);
                    break;

                case Syntax.ThrowStatement:
                case Syntax.UnaryExpression:
                case Syntax.UpdateExpression:
                    node.argument = rewrite(node.argument);
                    break;

                case Syntax.VariableDeclarator:
                    node.init = rewrite(node.init);
                    break;

                case Syntax.WhileStatement:
                    node.test = rewrite(node.test);
                    break;

                case Syntax.WithStatement:
                    node.object = rewrite(node.object);
                    break;
                }
            }
        });

        return result;
    }

    rewriteBoolean.passName = 'rewriteBoolean';
    return rewriteBoolean;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
