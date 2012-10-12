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
(function () {
    'use strict';

    var Syntax, common, modified, escope;

    common = require('../common');
    escope = require('escope');
    Syntax = common.Syntax;

    function getCandidates(scope) {
        var i, iz, j, jz, identifiers, slots, v;

        if (!scope.candidates) {
            slots = [];
            identifiers = [];
            for (i = 0, iz = scope.variables.length; i < iz; ++i) {
                v = scope.variables[i];
                for (j = 0, jz = v.identifiers.length; j < jz; ++j) {
                    identifiers.push(v.identifiers[j]);
                    slots.push(v);
                }
            }

            scope.candidates = {
                slots: slots,
                identifiers: identifiers
            };
        }

        return scope.candidates;
    }

    function dropVariableDefinition(tree, options) {
        var result, manager, scope, candidates;

        if (options == null) {
            options = { destructive: false };
        }

        result = options.destructive ? tree : common.deepCopy(tree);
        modified = false;
        scope = null;
        manager = escope.analyze(result);
        manager.attach();

        result = common.replace(result, {
            enter: function enter(node) {
                var i, iz, decl, ref, cand, index, slot, ret;
                ret = node;
                if (scope) {
                    if (scope.variableScope.isStatic()) {
                        cand = getCandidates(scope.variableScope);

                        // remove unused variable
                        if (node.type === Syntax.VariableDeclaration && node.kind === 'var') {
                            i = node.declarations.length;
                            while (i--) {
                                decl = node.declarations[i];
                                if (!decl.init) {
                                    index = cand.identifiers.indexOf(decl.id);
                                    common.assert(index !== -1);
                                    slot = cand.slots[index];
                                    if (slot.identifiers.length === 1 && slot.references.length === 0) {
                                        // ok, remove this variable
                                        modified = true;
                                        node.declarations.splice(i, 1);
                                        continue;
                                    }
                                }
                            }
                            if (node.declarations.length === 0) {
                                ret = common.moveLocation(node, {
                                    type: Syntax.EmptyStatement
                                });
                            }
                        }

                        // remove unused function declaration
                        if (node.type === Syntax.FunctionDeclaration) {
                            index = cand.identifiers.indexOf(node.id);
                            common.assert(index !== -1);
                            slot = cand.slots[index];
                            if (slot.identifiers.length === 1 && slot.references.length === 0) {
                                // ok, remove this function declaration
                                modified = true;
                                ret = common.moveLocation(node, {
                                    type: Syntax.EmptyStatement
                                });
                                return ret;
                            }
                        }
                    }
                }

                scope = manager.acquire(node) || scope;
                return ret;
            },
            leave: function leave(node) {
                scope = manager.release(node) || scope;
            }
        });

        manager.detach();

        return {
            result: result,
            modified: modified
        };
    }

    dropVariableDefinition.passName = 'drop-variable-definition';
    module.exports = dropVariableDefinition;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
