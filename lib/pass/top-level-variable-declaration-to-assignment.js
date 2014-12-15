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

    var Name, Syntax, estraverse, escope, common, modified;

    Name = 'top-level-variable-declaration-to-assignment';

    estraverse = require('estraverse');
    escope = require('escope');
    common = require('../common');
    Syntax = common.Syntax;

    function isStrictProgram(program) {
        var i, iz;
        if (!program.body.length) {
            return false;
        }
        for (i = 0, iz = program.body.length; i < iz; ++i) {
            if (program.body[i].type !== Syntax.DirectiveStatement) {
                return false;
            }
            if (program.body[i].value === 'use strict') {
                return true;
            }
        }
        return false;
    }

    function nothingChanged(result) {
        return {
            result: result,
            modified: false
        };
    }

    function topLevelVariableDeclarationToAssignment(tree, options) {
        var result, inNormalTopLevelCode;

        modified = false;

        if (options.get('topLevelContext', { pathName: Name }) !== 'global') {
            return nothingChanged(tree);
        }

        // If the top level code is strict code, this pass has no effect.
        if (options.get('inStrictCode', { pathName: Name })) {
            return nothingChanged(tree);
        }

        inNormalTopLevelCode = false;

        result = options.get('destructive', { pathName: Name }) ? tree : common.deepCopy(tree);

        result = estraverse.replace(result, {
            enter: function enter(node, parent) {
                var i, iz, decl, assigns, declarations, expr;
                if (node.type === Syntax.Program) {
                    if (isStrictProgram(node)) {
                        return this.break();
                    }
                    inNormalTopLevelCode = true;
                    return;
                }

                if (!inNormalTopLevelCode) {
                    return this.break();
                }

                if (common.isFunctionNode(node) || node.type === Syntax.CatchClause || node.type === Syntax.WithStatement) {
                    return this.skip();
                }

                if (node.type !== Syntax.VariableDeclaration) {
                    return;
                }

                if (node.kind !== 'var') {
                    return;
                }

                // FIXME: We don't support `for (var i = 20;  ...) ...` case.
                if (parent && parent.type === Syntax.ForStatement || parent.type === Syntax.ForInStatement || parent.type === Syntax.ForOfStatement) {
                    return;
                }

                assigns = [];
                declarations = [];
                for (i = 0, iz = node.declarations.length; i < iz; ++i) {
                    decl = node.declarations[i];
                    if (decl.init) {
                        assigns.push(common.moveLocation(decl, {
                            type: Syntax.AssignmentExpression,
                            operator: '=',
                            left: decl.id,
                            right: decl.init
                        }));
                    } else {
                        declarations.push(decl);
                    }
                }

                if (assigns.length) {
                    modified = true;
                    if (assigns.length === 1) {
                        expr = assigns[0];
                    } else {
                        expr = {
                            type: Syntax.SequenceExpression,
                            expressions: assigns
                        };
                    }
                    if (declarations.length === 0) {
                        return {
                            type: Syntax.ExpressionStatement,
                            expression: expr
                        };
                    }
                    node.declarations = declarations;
                    return {
                        type: Syntax.BlockStatement,
                        body: [
                            node,
                            {
                                type: Syntax.ExpressionStatement,
                                expression: expr
                            }
                        ]
                    };
                }
            }
        });

        return {
            result: result,
            modified: modified
        };
    }

    topLevelVariableDeclarationToAssignment.passName = Name;
    module.exports = topLevelVariableDeclarationToAssignment;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
