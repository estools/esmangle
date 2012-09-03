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
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    esmangle = require('../esmangle'),
    chai = require('chai'),
    expect = chai.expect;

// import remove-wasted-blocks pass
function registerPass(manager, mod) {
    var pass;
    pass = mod[Object.keys(mod)[0]]
    manager[pass.passName] = pass;
}

registerPass(esmangle.pass, require('esmangle-pass-remove-wasted-blocks'));

describe('compare mangling result', function () {
    fs.readdirSync(__dirname + '/compare').sort().forEach(function(file) {
        var code, expected, p;
        if (/\.js$/.test(file)) {
            if (!/expected\.js$/.test(file)) {
                p = file.replace(/\.js$/, '.expected.js');
                code = fs.readFileSync(__dirname + '/compare/' + file, 'utf-8');
                expected = fs.readFileSync(__dirname + '/compare/' + p, 'utf-8').trim();
                it(p, function () {
                    var tree, removed, mangled, actual;
                    tree = esprima.parse(code);
                    removed = esmangle.pass.removeWastedBlocks(tree);
                    mangled = esmangle.mangle(removed);
                    actual = escodegen.generate(mangled, {
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
