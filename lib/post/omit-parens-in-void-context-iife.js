/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

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

(function () {
    'use strict';

    var Syntax, common, modified;

    common = require('../common');
    Syntax = common.Syntax;


    function isIIFE(node) {
        var callee;

        if (node.type !== Syntax.CallExpression) {
            return false;
        }

        callee = node.callee;
        return callee.type === Syntax.FunctionExpression;
    }

    function main(tree, options) {
        var result, stackCount;

        if (options == null) {
            options = { destructive: false };
        }

        result = (options.destructive) ? tree : common.deepCopy(tree);
        modified = false;

        result = common.replace(result, {
            enter: function enter(node, parent) {
                var ancestors;

                if (parent.type !== Syntax.ExpressionStatement) {
                    return;
                }

                if (!isIIFE(node)) {
                    return;
                }

                ancestors = this.parents();
                ancestors.pop();  // remove parent: ExpressionStatement

                if (common.mayBeCompletionValue(parent, ancestors)) {
                    return;
                }

                // transform it
                modified = true;
                return {
                    type: Syntax.UnaryExpression,
                    operator: '!',
                    argument: node
                };
            },
            leave: function leave(node) {
                if (node.type === Syntax.FunctionExpression || node.type === Syntax.FunctionDeclaration) {
                    --stackCount;
                }
            }
        });

        return {
            result: result,
            modified: modified
        };
    }

    main.passName = 'omit-parens-in-void-context-iife';
    module.exports = main;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
