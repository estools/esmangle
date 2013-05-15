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

/*jslint node:true */

var fs = require('fs'),
    path = require('path'),
    root = path.join(path.dirname(fs.realpathSync(__filename)), '..'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    esmangle,
    chai = require('chai'),
    expect = chai.expect,
    defaultPass,
    defaultPost,
    existsSync;

Error.stackTraceLimit = Infinity;

existsSync = fs.existsSync || path.existsSync;
esmangle = require(root);
defaultPass = [
    esmangle.require('pass/tree-based-constant-folding'),
    esmangle.require('pass/hoist-variable-to-arguments'),
    esmangle.require('pass/transform-dynamic-to-static-property-access'),
    esmangle.require('pass/transform-dynamic-to-static-property-definition'),
    esmangle.require('pass/transform-immediate-function-call'),
    esmangle.require('pass/transform-logical-association'),
    esmangle.require('pass/reordering-function-declarations'),
    esmangle.require('pass/remove-unused-label'),
    esmangle.require('pass/remove-empty-statement'),
    esmangle.require('pass/remove-wasted-blocks'),
    esmangle.require('pass/transform-to-compound-assignment'),
    esmangle.require('pass/transform-to-sequence-expression'),
    esmangle.require('pass/transform-branch-to-expression'),
    esmangle.require('pass/transform-typeof-undefined'),
    esmangle.require('pass/reduce-sequence-expression'),
    esmangle.require('pass/reduce-branch-jump'),
    esmangle.require('pass/reduce-multiple-if-statements'),
    esmangle.require('pass/dead-code-elimination'),
    esmangle.require('pass/remove-side-effect-free-expressions'),
    esmangle.require('pass/remove-context-sensitive-expressions'),
    esmangle.require('pass/concatenate-variable-definition'),
    esmangle.require('pass/drop-variable-definition'),
    esmangle.require('pass/remove-unreachable-branch')
];

defaultPost = [
    esmangle.require('post/transform-static-to-dynamic-property-access'),
    esmangle.require('post/transform-infinity'),
    esmangle.require('post/rewrite-boolean'),
    esmangle.require('post/rewrite-conditional-expression'),
    esmangle.require('post/omit-parens-in-void-context-iife')
];

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
        destructive: true
    }, options));
}

function doTest(tree, expected) {
    var pass, post, options, actual;
    pass = defaultPass;
    post = defaultPost;
    options = {};
    tree.comments.some(function (comment) {
        var parsed;
        try {
            parsed = JSON.parse(comment.value.trim());
            if (typeof parsed === 'object' && parsed !== null) {
                pass = parsed.pass ? parsed.pass.map(function (name) {
                    return esmangle.require('pass/' + name);
                }) : defaultPass;
                post = parsed.post ? parsed.post.map(function (name) {
                    return esmangle.require('post/' + name);
                }) : defaultPost;
                options = parsed.options ? parsed.options : {};
                return true;
            }
        } catch (e) { }
        return false;
    });
    tree = doOptimize(tree, pass, post, options);
    actual = escodegen.generate(tree, {
        format: {
            renumber: true,
            hexadecimal: true,
            escapeless: true,
            compact: true,
            semicolons: false,
            parentheses: false
        },
        directive: true
    });
    expect(actual).to.be.equal(expected);
}

describe('compare mangling result', function () {
    fs.readdirSync(__dirname + '/compare').sort().forEach(function(file) {
        var p;
        if (/\.js$/.test(file)) {
            if (!/expected\.js$/.test(file)) {
                p = file.replace(/\.js$/, '.expected.js');
                it(path.join('test', 'compare', file), function () {
                    var codeName, code, expectedName, tree, expected;

                    codeName = __dirname + '/compare/' + file;
                    expectedName = __dirname + '/compare/' + p;

                    expect(existsSync(codeName)).to.be.true;
                    expect(existsSync(expectedName)).to.be.true;

                    code = fs.readFileSync(codeName, 'utf-8');
                    expected = fs.readFileSync(expectedName, 'utf-8').trim();
                    tree = esprima.parse(code, { comment: true });
                    // normal test
                    doTest(tree, expected);
                    // raw test
                    tree = esprima.parse(code, { comment: true, raw: true });
                    doTest(tree, expected);
                });
            }
        }
    });
});

/* vim: set sw=4 ts=4 et tw=80 : */
