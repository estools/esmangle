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
        fs = require('fs'),
        Q = require('q'),
        submodule = path.join('test', 'regression', 'esmangle'),
        REV;

    REV = '675e4522936263f1b07ba1a5d10a06c152a170e5';

    grunt.extendConfig({
        git_reset_hard: {
            esmangle: {
                cwd: submodule
            }
        },
        npm_install: {
            esmangle: {
                cwd: submodule
            }
        },
        esmangle_apply: {
            esmangle: {
                files: {
                    src: path.join(submodule, 'lib', '**', '*.js')
                }
            }
        },
        shell: {
            executeEsmangleTest: {
                command: '../../../node_modules/.bin/grunt mochaTest',
                options: {
                    stdout: true,
                    stderr: true,
                    failOnError: true,
                    execOptions: {
                        cwd: submodule
                    }
                }
            }

        }
    });

    function spawn(cmd, args, opts) {
        var deferred = Q.defer();

        grunt.util.spawn({
            cmd: cmd,
            args: args,
            opts: opts
        }, function (err, res) {
            if (err) {
                deferred.reject(err);
                return;
            }
            deferred.resolve(res);
        });

        return deferred.promise;
    }

    // Because of submodule recursive dependency, we write clone code manually.
    // (Not using git submodule)
    grunt.registerTask('test:regression:esmangle:clone', 'esmangle clone', function () {
        var done = this.async();

		grunt.verbose.writeln('Cloning esmangle regression test...');

        if (fs.existsSync(submodule)) {
            done();
            return;
        }

        return spawn('git', ['clone', 'https://github.com/Constellation/esmangle.git', submodule])
        .then(function() {
            done();
        })
        .fail(function(err) {
            grunt.verbose.error(err);
            done(err);
        });
    });

    grunt.registerTask('test:regression:esmangle:update', 'esmangle update', function () {
        var done = this.async();

		grunt.verbose.writeln('Updating esmangle regression test...');

        spawn('git', ['rev-parse', '--verify', 'HEAD'], { cwd: submodule })
        .then(function (res) {
            if (res.stdout.trim() === REV) {
                // desired revision
                done();
                return;
            }

            spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: submodule })
            .then(function (res) {
                if (res.stdout !== 'master') {
                    return spawn('git', ['reset', '--hard'], { cwd: submodule })
                    .then(function () {
                        return spawn('git', ['clean', '-df'], { cwd: submodule });
                    })
                    .then(function () {
                        return spawn('git', ['checkout', 'master'], { cwd: submodule });
                    });
                }
            })
            .then(function () {
                return spawn('git', ['pull', 'origin', 'master'], { cwd: submodule });
            })
            .then(function () {
                return spawn('git', ['checkout', REV], { cwd: submodule });
            })
            .then(function () { done(); });
        })
        .fail(function (err) {
            grunt.verbose.error(err);
            done(err);
        });
    });

    grunt.registerTask('test:regression:esmangle', [
        'git_reset_hard:esmangle',
        'test:regression:esmangle:clone',
        'test:regression:esmangle:update',
        'npm_install:esmangle',
        'esmangle_apply:esmangle',
        'shell:executeEsmangleTest',
        'git_reset_hard:esmangle'
    ]);
};
/* vim: set sw=4 ts=4 et tw=80 : */
