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
    // FIXME current esprima 0.9.9 has bug, so use dev 1.0.0
    esprima = require(path.join(root, 'lib', 'esprima')),
    escodegen = require('escodegen'),
    optimist = require('optimist'),
    esmangle,
    argv,
    post,
    passes;

esmangle = require(root);

argv = optimist.usage("Usage: $0 file")
    .boolean('source-map')
    .describe('source-map', 'dump source-map')
    .string('o')
    .alias('o', 'output')
    .describe('o', 'output file')
    .demand(1).argv;

argv._.forEach(function (filename) {
    var content, tree, result;
    content = fs.readFileSync(filename, 'utf-8');
    tree = esprima.parse(content, { loc: true });
    tree = esmangle.optimize(tree, null, {
        destructive: true,
        directive: true
    });
    tree = esmangle.mangle(tree, {
        destructive: true
    });
    result = escodegen.generate(tree, {
        format: {
            renumber: true,
            hexadecimal: true,
            escapeless: true,
            compact: true,
            semicolons: false,
            parentheses: false
        },
        sourceMap: argv['source-map'] && filename,
        directive: true
    });
    if (argv.output) {
        fs.writeFile(argv.output, result);
    } else {
        console.log(result);
    }
});
/* vim: set sw=4 ts=4 et tw=80 : */
