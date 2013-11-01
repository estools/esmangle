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
    esmangle = path.join(root, 'bin', 'esmangle.js'),
    child = require('child_process'),
    q = require('q'),
    chai = require('chai'),
    expect = chai.expect;

Error.stackTraceLimit = Infinity;

function spawn(cmd, args, cwd) {
    var proc, deferred, result;
    proc = child.spawn(cmd, args, {
        cwd: cwd
    });

    deferred = q.defer();

    proc.on('error', function (error) {
        deferred.reject(error);
    });

    result = '';
    proc.stdout.setEncoding('utf-8');
    proc.stdout.on('data', function (data) {
        result += data;
    });

    proc.on('exit', function(code) {
        if (code !== 0) {
            deferred.reject(new Error(cmd + ' ' + args.join(' ') + ' in ' + cwd + ' exited with ' + code));
        } else {
            deferred.resolve(result);
        }
    });

    return deferred.promise;
}

function file(name) {
    return path.join(root, 'test', 'cli', name);
}

describe('cli', function () {
    describe('propagate-license-comment-to-header', function () {
        it('block comment license works', function (done) {
            spawn(esmangle, [
                '--propagate-license-comment-to-header',
                file('propagate-license-comment-to-header/license-block.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('propagate-license-comment-to-header/license-block.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });

        it('block comment license inner function works', function (done) {
            spawn(esmangle, [
                '--propagate-license-comment-to-header',
                file('propagate-license-comment-to-header/license-block-2.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('propagate-license-comment-to-header/license-block-2.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });

        it('line comment license works', function (done) {
            spawn(esmangle, [
                '--propagate-license-comment-to-header',
                file('propagate-license-comment-to-header/license-line.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('propagate-license-comment-to-header/license-line.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });

        it('line comment license inner function works', function (done) {
            spawn(esmangle, [
                '--propagate-license-comment-to-header',
                file('propagate-license-comment-to-header/license-line-2.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('propagate-license-comment-to-header/license-line-2.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });
    });

    describe('preserve-license-comment', function () {
        it('block comment license works', function (done) {
            spawn(esmangle, [
                '--preserve-license-comment',
                file('preserve-license-comment/license-block.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('preserve-license-comment/license-block.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });

        it('block comment license inner function works', function (done) {
            spawn(esmangle, [
                '--preserve-license-comment',
                file('preserve-license-comment/license-block-2.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('preserve-license-comment/license-block-2.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });

        it('line comment license works', function (done) {
            spawn(esmangle, [
                '--preserve-license-comment',
                file('preserve-license-comment/license-line.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('preserve-license-comment/license-line.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });

        it('line comment license inner function works', function (done) {
            spawn(esmangle, [
                '--preserve-license-comment',
                file('preserve-license-comment/license-line-2.js')
            ]).then(function (result) {
                var expected;
                expected = fs.readFileSync(file('preserve-license-comment/license-line-2.expected.js'), 'utf-8');
                expect(result).to.be.equal(expected);
                done();
            }).catch(done);
        });
    });
});

/* vim: set sw=4 ts=4 et tw=80 : */
