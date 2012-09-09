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
        define('esmangle/pass/reduce-sequence-expression', ['module', 'esmangle/common'], function(module, common) {
            module.exports = factory(common);
        });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(require('../common'));
    } else {
        namespace('esmangle.pass', global).reduceSequenceExpression = factory(namespace('esmangle.common', global));
    }
}(function (common) {
    'use strict';

    var Syntax, traverse, deepCopy, modified;

    Syntax = common.Syntax;
    traverse = common.traverse;
    deepCopy = common.deepCopy;

    function reduce(node) {
        var i, iz, j, jz, expr, result;
        result = [];
        for (i = 0, iz = node.expressions.length; i < iz; ++i) {
            expr = node.expressions[i];
            if (expr.type === Syntax.SequenceExpression) {
                modified = true;
                // delete SequenceExpression location information,
                // because information of SequenceExpression is not used effectively in source-map.
                common.deleteLocation(node);
                for (j = 0, jz = expr.expressions.length; j < jz; ++j) {
                    result.push(expr.expressions[j]);
                }
            } else {
                result.push(expr);
            }
        }
        node.expressions = result;
    }

    function reduceSequenceExpression(tree, options) {
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
                if (node.type === Syntax.SequenceExpression) {
                    reduce(node);
                }
            }
        });

        return {
            result: result,
            modified: modified
        };
    }

    reduceSequenceExpression.passName = 'reduce-sequence-expression';
    return reduceSequenceExpression;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
