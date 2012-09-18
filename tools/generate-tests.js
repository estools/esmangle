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

(function () {
    'use strict';
    var fs = require('fs'),
        path = require('path'),
        child_process = require('child_process'),
        root = path.join(path.dirname(fs.realpathSync(__filename)), '..'),
        names = process.argv.splice(2),
        name,
        test,
        expected;

    if (names.length === 0) {
        console.log('Usage:');
        console.log('    node generate-tests.js name');
        process.exit(1);
    }

    name = names[0];
    test = path.join(root, 'test', 'compare', name + '.js');
    expected = path.join(root, 'test', 'compare', name + '.expected.js');

    fs.writeFileSync(test, '', 'utf-8');
    fs.writeFileSync(expected, '', 'utf-8');
    child_process.spawn(process.env.EDITOR, [test, expected], {
        customFds: [
            process.stdin,
            process.stdout,
            process.stderr
        ]
    });
}());
