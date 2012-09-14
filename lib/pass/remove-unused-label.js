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
        define('esmangle/pass/remove-unused-label', ['module', 'esmangle/common'], function(module, common) {
            module.exports = factory(common);
        });
    } else if (typeof module !== 'undefined') {
        module.exports = factory(require('../common'));
    } else {
        namespace('esmangle.pass', global).removeUnusedLabel = factory(namespace('esmangle.common', global));
    }
}(function (common) {
    'use strict';

    var Syntax, scope, modified;

    Syntax = common.Syntax;

    function Scope(upper) {
        this.set = {};
        this.unused = [];
        this.upper = upper;
    }

    Scope.prototype.register = function register(node) {
        var name;
        if (node.type === Syntax.LabeledStatement) {
            name = node.label.name;
            common.assert(!this.set.hasOwnProperty(name), 'duplicate label is found');
            this.set[name] = {
                used: false,
                stmt: node
            };
        }
    };

    Scope.prototype.unregister = function unregister(node) {
        var name, ref;
        if (node.type === Syntax.LabeledStatement) {
            name = node.label.name;
            ref = this.set[name];
            delete this.set[name];
            if (!ref.used) {
                modified = true;
                return node.body;
            }
        }
        return node;
    };

    Scope.prototype.resolve = function resolve(node) {
        var name;
        if (node.label) {
            name = node.label.name;
            common.assert(this.set.hasOwnProperty(name), 'unresolved label');
            this.set[name].used = true;
        }
    };

    Scope.prototype.close = function close() {
        return this.upper;
    };

    function removeUnusedLabel(tree, options) {
        var result;

        if (options == null) {
            options = { destructive: false };
        }

        result = (options.destructive) ? tree : common.deepCopy(tree);
        scope = null;
        modified = false;

        result = common.replace(result, {
            enter: function enter(node) {
                var i, iz;
                switch (node.type) {
                    case Syntax.Program:
                    case Syntax.FunctionDeclaration:
                    case Syntax.FunctionExpression:
                        scope = new Scope(scope);
                        break;

                    case Syntax.LabeledStatement:
                        scope.register(node);
                        break;

                    case Syntax.BreakStatement:
                    case Syntax.ContinueStatement:
                        scope.resolve(node);
                        break;
                }
            },
            leave: function leave(node) {
                var ret;
                ret = scope.unregister(node);
                if (node.type === Syntax.Program || node.type === Syntax.FunctionDeclaration || node.type === Syntax.FunctionExpression) {
                    scope = scope.close();
                }
                return ret;
            }
        });

        return {
            result: result,
            modified: modified
        };
    }

    removeUnusedLabel.passName = 'remove-unused-label';
    return removeUnusedLabel;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
