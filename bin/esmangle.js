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

/*jslint sloppy:true node:true */

var fs = require('fs'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    esmangle = require('esmangle'),
    files = process.argv.splice(2);

// import remove-wasted-blocks pass
function registerPass(manager, mod) {
    var pass;
    pass = mod[Object.keys(mod)[0]]
    manager[pass.passName] = pass;
}

registerPass(esmangle.pass, require('esmangle-pass-remove-wasted-blocks'));

if (files.length === 0) {
    console.log('Usage:');
    console.log('   esmangle file.js');
    process.exit(1);
}

files.forEach(function (filename) {
    var content, tree;
    content = fs.readFileSync(filename, 'utf-8');
    tree = esprima.parse(content);
    tree = esmangle.pass.removeWastedBlocks(tree);
    tree = esmangle.mangle(tree);
    console.log(escodegen.generate(tree, {
        format: {
            renumber: true,
            hexadecimal: true,
            escapeless: true,
            compact: true,
            semicolons: false,
            parentheses: false
        }
    }));
});
/* vim: set sw=4 ts=4 et tw=80 : */
