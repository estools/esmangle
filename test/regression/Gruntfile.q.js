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
    var path = require('path'),
        child_process = require('child_process'),
        async = require('async'),
        submodule = path.join('test', 'regression', 'q'),
        test = path.join('test', 'regression', 'q.tmp');

    grunt.extendConfig({
        copy: {
            q: {
                expand: true,
                src: [ '**/*' ],
                dest: test,
                filter: 'isFile',
                cwd: submodule
            }
        },
        shell: {
            installQ: {
                command: 'npm install',
                options: {
                    stdout: true,
                    stderr: true,
                    failOnError: true,
                    execOptions: {
                        cwd: test
                    }
                }
            },
            executeQTest: {
                command: 'npm test',
                options: {
                    stdout: true,
                    stderr: true,
                    failOnError: true,
                    execOptions: {
                        cwd: test
                    }
                }
            }

        }
    });

    grunt.registerTask('test:regression:q:apply', 'esmangle apply', function () {
        var done = this.async(),
            result = [],
            log;
        result.push(path.join(test, 'q.js'));
        result.push(path.join(test, 'queue.js'));
        log = grunt.log.write('minifying files...');
        async.eachLimit(result, 10, function (item, callback) {
            var escaped = JSON.stringify(item);
            child_process.exec('node bin/esmangle.js ' + escaped + ' -o ' + escaped, function (err) {
                callback(err);
            });
        }, function (err) {
            if (err) {
                log.error();
                done(false);
            } else {
                log.ok();
                done(true);
            }
        });
    });

    grunt.registerTask('test:regression:q', [
        'update_submodules',
        'copy:q',
        'shell:installQ',
        'test:regression:q:apply',
        'shell:executeQTest'
    ]);
};
/* vim: set sw=4 ts=4 et tw=80 : */
