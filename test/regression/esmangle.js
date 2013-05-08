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

module.exports = function (grunt) {
    'use strict';
    var path = require('path');

    grunt.extendConfig({
        copy: {
            esmangle: {
                expand: true,
                src: [ '**/*' ],
                dest: path.join('test', 'regression', 'esmangle.tmp'),
                filter: 'isFile',
                cwd: path.join('test', 'regression', 'esmangle')
            }
        },
        clean: {
            esmangle: [
                path.join('test', 'regression', 'esmangle.tmp')
            ]
        },
        shell: {
            installEsmangle: {
                command: 'npm install',
                options: {
                    stdout: true,
                    stderr: true,
                    execOptions: {
                        cwd: path.join('test', 'regression', 'esmangle')
                    }
                }
            }
        }
    });

    grunt.registerTask('test:regression:esmangle:main', 'esmangle regression test', function () {
        var done = this.async();
        done();
    });

    grunt.registerTask('test:regression:esmangle', [
        'update_submodules',
        'shell:installEsmangle',
        'copy:esmangle',
        'test:regression:esmangle:main',
        'clean:esmangle'
    ]);
};
/* vim: set sw=4 ts=4 et tw=80 : */
