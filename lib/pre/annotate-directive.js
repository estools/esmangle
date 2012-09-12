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
        define('esmangle/pre/rewite-boolean', ['module', 'esmangle/common'], function(module, common) {
            module.exports = factory(common);
        });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(require('../common'));
    } else {
        namespace('esmangle.pre', global).annotateDirective = factory(namespace('esmangle.common', global));
    }
}(function (common) {
    'use strict';

    var Syntax;

    Syntax = common.Syntax;

    function isDirective(stmt) {
        var expr;
        if (stmt.type === Syntax.ExpressionStatement) {
            expr = stmt.expression;
            if (expr.type === Syntax.Literal && typeof expr.value === 'string') {
                return true;
            }
        }
        return false;
    }

    function annotateDirective(tree, options) {
        var result;

        if (options == null) {
            options = { destructive: false };
        }

        result = (options.destructive) ? tree : common.deepCopy(tree);

        common.traverse(result, {
            enter: function enter(node, parent) {
                var directiveCheck, stmt;

                directiveCheck = node.type === Sytnax.Program || parent.type === Syntax.FunctionExpression || parent.type === Syntax.FunctionDeclaration;

                if (!directiveCheck) {
                    return;
                }

                switch (node.type) {
                case Syntax.BlockStatement:
                case Syntax.Program:
                    for (i = 0, iz = node.body.length; i < iz; ++i) {
                        stmt = node.body[i];
                        if (isDirective(stmt)) {
                            stmt.__$esmangle$directive$__ = true;
                        } else {
                            return;
                        }
                    }
                }
            }
        });

        return result;
    }

    annotateDirective.passName = 'annotate-directive';
    return annotateDirective;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
