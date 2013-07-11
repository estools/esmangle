/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

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
    esmangle,
    common,
    chai = require('chai'),
    expect = chai.expect,
    defaultPass,
    defaultPost,
    existsSync;

Error.stackTraceLimit = Infinity;

existsSync = fs.existsSync || path.existsSync;
esmangle = require(root);
common = require(path.join(root, 'lib', 'common'));

describe('utility', function () {
    it('common.isIdentifier(...) === true', function () {
        var data;

        data = [
            '_',
            '$',
            'a0',
            'ゆるゆり'
        ];

        data.forEach(function (val) {
            expect(common.isIdentifier(val)).to.be.true;
        });
    });

    it('common.isIdentifier(...) === false', function () {
        var data;

        data = [
            '0',
            '\\u',
            '\\u0061\\u0062',
            'a\\b',
            '.'
        ];

        data.forEach(function (val) {
            expect(common.isIdentifier(val), val).to.be.false;
        });
    });
});

/* vim: set sw=4 ts=4 et tw=80 : */
