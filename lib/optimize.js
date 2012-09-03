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

/*jslint bitwise:true */
/*global esmangle:true, exports:true, define:true*/
(function (factory, global) {
    'use strict';

    function namespace(str, obj) {
        var i, iz, names, name;
        names = str.split('.');
        for (i = 0, iz = names.length; i < iz; ++i) {
            name = names[i];
            if (obj.hasOwnProperty(name)) {
                obj = obj[name];
            } else {
                obj = (obj[name] = {});
            }
        }
        return obj;
    }

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // and plain browser loading,
    if (typeof define === 'function' && define.amd) {
        define('esmangle/common', ['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else if (typeof window !== 'undefined') {
        factory(namespace('esmangle.optimizer', window));
    } else {
        factory(namespace('esmangle.optimizer', global));
    }
}(function (exports) {
    'use strict';

    var statuses, passes;

    function addPass(pass) {
        var name;
        if (typeof pass !== 'function') {
            // automatic lookup pass (esmangle pass format)
            name = Object.keys(pass)[0];
            pass = pass[name];
        }
        if (pass.hasOwnProperty('passName')) {
            name = pass.passName;
        } else {
            name = pass.name;
        }
        passes.push(pass);
        statuses.push(false);
    }

    function fillStatuses(i, last, bool) {
        for (; i < last; ++i) {
            statuses[i] = bool;
        }
    }

    function run(tree) {
        var i, iz, pass, res, sl, changed;
        sl = statuses.length;
        fillStatuses(0, sl, true);
        do {
            changed = false;
            for (i = 0, iz = sl; i < iz; ++i) {
                pass = passes[i];
                if (statuses[i]) {
                    res = pass(tree, { destructive: false });
                    if (res.modified) {
                        changed = true;
                        fillStatuses(0, i, true);
                        fillStatuses(i + 1, sl, true);
                    }
                    statuses[i] = false;
                    tree = res.result;
                }
            }
        } while (changed);
        return tree;
    }

    function optimize(tree, p) {
        var i, iz;

        statuses = [];
        passes = [];

        for (i = 0, iz = p.length; i < iz; ++i) {
            addPass(p[i]);
        }

        return run(tree);
    }

    exports.optimize = optimize;
}, this));
/* vim: set sw=4 ts=4 et tw=80 : */
