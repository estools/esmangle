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
    defaultPost;

esmangle = require(path.join(root, 'esmangle'));
defaultPass = [
    esmangle.require('lib/pass/transform-dynamic-to-static-property-access'),
    esmangle.require('lib/pass/reordering-function-declarations'),
    esmangle.require('lib/pass/remove-unused-label'),
    esmangle.require('lib/pass/remove-empty-statement'),
    esmangle.require('lib/pass/remove-wasted-blocks'),
    esmangle.require('lib/pass/transform-to-compound-assignment'),
    esmangle.require('lib/pass/transform-to-sequence-expression'),
    esmangle.require('lib/pass/transform-branch-to-expression'),
    esmangle.require('lib/pass/reduce-sequence-expression'),
    esmangle.require('lib/pass/reduce-branch-jump'),
    esmangle.require('lib/pass/dead-code-elimination')
];

defaultPost = [
    esmangle.require('lib/post/transform-static-to-dynamic-property-access'),
    esmangle.require('lib/post/rewrite-boolean'),
    esmangle.require('lib/post/rewrite-conditional-expression')
];

describe('compare mangling result', function () {
    fs.readdirSync(__dirname + '/compare').sort().forEach(function(file) {
        var code, expected, p;
        if (/\.js$/.test(file)) {
            if (!/expected\.js$/.test(file)) {
                p = file.replace(/\.js$/, '.expected.js');
                code = fs.readFileSync(__dirname + '/compare/' + file, 'utf-8');
                expected = fs.readFileSync(__dirname + '/compare/' + p, 'utf-8').trim();
                it(p, function () {
                    var tree, actual, config, post, pass;

                    tree = esprima.parse(code, { comment: true });

                    tree.comments.some(function (comment) {
                        var parsed;
                        try {
                            parsed = JSON.parse(comment.value.trim());
                            if (typeof parsed === 'object' && parsed !== null) {
                                config = parsed
                                return true;
                            }
                        } catch (e) { }
                        return false;
                    });

                    if (config && config.pass) {
                        pass = config.pass.map(function (name) {
                            return esmangle.require('lib/pass/' + name);
                        });
                    } else {
                        pass = defaultPass;
                    }

                    if (config && config.post) {
                        post = config.post.map(function (name) {
                            return esmangle.require('lib/post/' + name);
                        });
                    } else {
                        post = defaultPost;
                    }

                    tree = esmangle.optimize(tree, pass);
                    tree = post.reduce(function (tree, p) {
                        return p(tree);
                    }, tree);
                    tree = esmangle.mangle(tree, {
                        destructive: true
                    });
                    actual = escodegen.generate(tree, {
                        format: {
                            renumber: true,
                            hexadecimal: true,
                            escapeless: true,
                            compact: true,
                            semicolons: false,
                            parentheses: false
                        }
                    });
                    expect(actual).to.be.equal(expected);
                });
            }
        }
    });
});

/* vim: set sw=4 ts=4 et tw=80 : */
