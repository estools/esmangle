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
    passes,
    multipleFilesSpecified;

Error.stackTraceLimit = Infinity;

esmangle = require(root);

argv = optimist.usage("Usage: $0 file")
    .describe('help', 'show help')
    .boolean('source-map')
    .describe('source-map', 'dump source-map')
    .boolean('preserve-completion-value')
    .describe('preserve-completion-value', 'preserve completion values if needed')
    .string('o')
    .alias('o', 'output')
    .describe('o', 'output file')
    .argv;

multipleFilesSpecified = (argv.output && Array.isArray(argv.output) && argv.output.length > 1);

if (argv.help || multipleFilesSpecified) {
    optimist.showHelp();
    if (multipleFilesSpecified) {
        console.error('multiple output files are specified');
    }
    process.exit(1);
}

function output(code) {
    if (argv.output) {
        fs.writeFileSync(argv.output, code);
    } else {
        console.log(code);
    }
}

function compile(content, filename) {
    var tree;
    tree = esprima.parse(content, { loc: true, raw: true });
    tree = esmangle.optimize(tree, null, {
        destructive: true,
        directive: true,
        preserveCompletionValue: argv['preserve-completion-value']
    });
    tree = esmangle.mangle(tree, {
        destructive: true
    });
    return escodegen.generate(tree, {
        format: escodegen.FORMAT_MINIFY,
        sourceMap: argv['source-map'] && filename,
        directive: true
    });
}

if (argv._.length === 0) {
    // no file is specified, so use stdin as input
    (function () {
        var code = '';
        process.stdin.on('data', function (data) {
            code += data;
        });
        process.stdin.on('end', function (err) {
            output(compile(code, 'stdin'));
        });
        process.stdin.resume();
    }());
} else {
    argv._.forEach(function (filename) {
        var content, result;
        content = fs.readFileSync(filename, 'utf-8');
        result = compile(content, filename);
        output(result);
    });
}
/* vim: set sw=4 ts=4 et tw=80 : */
