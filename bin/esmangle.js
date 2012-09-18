#!/usr/bin/env node
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
    optimist = require('optimist'),
    esmangle,
    argv,
    post,
    passes;

esmangle = require(path.join(root, 'esmangle'));
passes = [
    esmangle.require('lib/pass/hoist-variable-to-arguments'),
    esmangle.require('lib/pass/transform-dynamic-to-static-property-access'),
    esmangle.require('lib/pass/transform-dynamic-to-static-property-definition'),
    esmangle.require('lib/pass/reordering-function-declarations'),
    esmangle.require('lib/pass/remove-unused-label'),
    esmangle.require('lib/pass/remove-empty-statement'),
    esmangle.require('lib/pass/remove-wasted-blocks'),
    esmangle.require('lib/pass/transform-to-compound-assignment'),
    esmangle.require('lib/pass/transform-to-sequence-expression'),
    esmangle.require('lib/pass/transform-branch-to-expression'),
    esmangle.require('lib/pass/transform-typeof-undefined'),
    esmangle.require('lib/pass/reduce-sequence-expression'),
    esmangle.require('lib/pass/reduce-branch-jump'),
    esmangle.require('lib/pass/reduce-multiple-if-statements'),
    esmangle.require('lib/pass/dead-code-elimination'),
    esmangle.require('lib/pass/remove-side-effect-free-expressions')
];

argv = optimist.usage("Usage: $0 file")
    .boolean('source-map')
    .describe('source-map', 'dump source-map')
    .demand(1).argv;

post = [
    esmangle.require('lib/post/transform-static-to-dynamic-property-access'),
    esmangle.require('lib/post/rewrite-boolean'),
    esmangle.require('lib/post/rewrite-conditional-expression')
];

argv._.forEach(function (filename) {
    var content, tree;
    content = fs.readFileSync(filename, 'utf-8');
    tree = esprima.parse(content, { loc: true });
    tree = esmangle.optimize(tree, [ passes, post ], {
        destructive: true
    });
    tree = esmangle.mangle(tree, {
        destructive: true
    });
    console.log(escodegen.generate(tree, {
        format: {
            renumber: true,
            hexadecimal: true,
            escapeless: true,
            compact: true,
            semicolons: false,
            parentheses: false
        },
        sourceMap: argv['source-map'] && filename
    }));
});
/* vim: set sw=4 ts=4 et tw=80 : */
