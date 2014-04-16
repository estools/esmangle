/*
  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

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
/*global module:true, require:true*/
(function () {
    'use strict';

    var Name, Syntax, common, modified;

    Name = 'typeof-prefix-comparison';
    common = require('../common');
    Syntax = common.Syntax;

    function isTypeof(node) {
        return node.type === 'UnaryExpression' && node.operator === 'typeof';
    }

    function extractLiteral(node) {
        // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-typeof-operator
        var index,
            literalMap = {
                'undefined': 0,
                'object': 0,
                'boolean': 0,
                'number': 0,
                'string': 1,
                'function': 0,
                'symbol': 1      // ES6 Symbol
            };
        if (node.type !== Syntax.Literal) {
            return false;
        }
        if (typeof node.value !== 'string') {
            return false;
        }
        if (!common.Object.has(literalMap, node.value)) {
            return false;
        }
        index = literalMap[node.value];
        return {
            value: node.value.charAt(index),
            index: index,
        };
    }

    function optimize(parentNode, leftIsTypeof, typeofNode, literalNode, info) {
        var wrapped, literal;

        wrapped = {
            type: 'MemberExpression',
            computed: true,
            object: typeofNode,
            property: {
                type: 'Literal',
                value: info.index
            }
        };

        literal = common.moveLocation(literalNode, {
            type: 'Literal',
            value: info.value
        });

        if (leftIsTypeof) {
            parentNode.left = wrapped;
            parentNode.right = literal;
        } else {
            parentNode.right = wrapped;
            parentNode.left = literal;
        }

        if (parentNode.operator === '===' || parentNode.operator === '==') {
            parentNode.operator = '==';
        } else {
            parentNode.operator = '!=';
        }

        modified = true;

        return parentNode;
    }

    function main(tree, options) {
        var result, legacy;

        result = options.get('destructive', { pathName: Name }) ? tree : common.deepCopy(tree);
        legacy = options.get('legacy', { pathName: Name });

        if (legacy) {
            return {
                result: result,
                modified: false
            };
        }

        modified = false;

        result = common.replace(result, {
            leave: function leave(node) {
                var info;
                if (node.type !== Syntax.BinaryExpression) {
                    return;
                }

                if (node.operator !== '===' && node.operator !== '==' &&
                    node.operator !== '!==' && node.operator !== '!=') {
                    return;
                }

                if (isTypeof(node.left)) {
                    info = extractLiteral(node.right);
                    if (info) {
                        return optimize(node, true, node.left, node.right, info);
                    }
                } else if (isTypeof(node.right)) {
                    info = extractLiteral(node.left);
                    if (info) {
                        return optimize(node, false, node.right, node.left, info);
                    }
                }
                return;
            }
        });

        return {
            result: result,
            modified: modified
        };
    }

    main.passName = Name;
    module.exports = main;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
