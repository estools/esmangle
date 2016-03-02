/*
  Copyright (C) 2015 Ariya Hidayat <ariya.hidayat@gmail.com>

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

/*jslint node:true */

var fs = require('fs'),
    path = require('path'),
    root = path.join(path.dirname(fs.realpathSync(__filename)), '..'),
    esmangle = require(root),
    chai = require('chai'),
    expect = chai.expect;

function extend(target, update) {
    return Object.getOwnPropertyNames(update).reduce(function (result, key) {
        if (key in result) {
            result[key] = extend(result[key], update[key]);
        } else {
            result[key] = update[key];
        }
        return result;
    }, target);
}

function doOptimize(tree, pass, post, options) {
    tree = esmangle.optimize(tree, [ pass, { once: true, pass: post } ], extend({
        directive: true
    }, options));
    return esmangle.mangle(tree, extend({
        destructive: true,
        distinguishFunctionExpressionScope: false
    }, options));
}

describe('try statement', function() {

    it('should have handlers converted into handler', function() {
        var pass, post, options, code, statement, tree;

        pass = [esmangle.pass.require('pass/dead-code-elimination')];
        post = [];
        options = {};

        code = 'try {} catch (e) {}',
        
        statement = {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: []
            },
            handlers: [
                {
                    type: 'CatchClause',
                    param: {
                        type: 'Identifier',
                        name: 'e'
                    },
                    body: {
                        type: 'BlockStatement',
                        body: []
                    }
                }
            ],
            finalizer: null
        }
        tree = {
            type: 'Program',
            body: [statement]
        };
        
        tree = doOptimize(tree, pass, post, options);
        statement = tree.body[0];

        expect(statement.handlers).to.undefined;
        expect(statement.handler).to.exist;
        expect(statement.handler.type).to.equal('CatchClause');
    });

    it('should keep using handler', function() {
        var pass, post, options, code, statement, tree;

        pass = [esmangle.pass.require('pass/dead-code-elimination')];
        post = [];
        options = {};

        code = 'try {} catch (e) {}',
        
        statement = {
            type: 'TryStatement',
            block: {
                type: 'BlockStatement',
                body: []
            },
            handler: {
                type: 'CatchClause',
                param: {
                    type: 'Identifier',
                    name: 'e'
                },
                body: {
                    type: 'BlockStatement',
                    body: []
                }
            },
            finalizer: null
        }
        tree = {
            type: 'Program',
            body: [statement]
        };
        
        tree = doOptimize(tree, pass, post, options);
        statement = tree.body[0];

        expect(statement.handlers).to.undefined;
        expect(statement.handler).to.exist;
        expect(statement.handler.type).to.equal('CatchClause');
    });
});
