esmangle ([esmangle](http://github.com/Constellation/esmangle)) is
mangler / minifier for [Parser API](https://developer.mozilla.org/en/SpiderMonkey/Parser_API) AST.


### Install

esmangle can be used in a web browser:

    <script src="esmangle.js"></script>

or in a Node.js application via the package manager:

    npm install esmangle


### Usage

A simple example: the program

    var ast = esprima.parse(code);
    var result = esmangle.mangle(ast);  // gets mangled result

Or you can simply use this `esmangle` command in the shell.

    $ esmangle file.js

### Note

This resolution algorithm is based on my bytecode compiler [iv / lv5 / railgun](https://github.com/Constellation/iv/tree/master/iv/lv5/railgun).

### License

Copyright (C) 2012 [Yusuke Suzuki](http://github.com/Constellation)
 (twitter: [@Constellation](http://twitter.com/Constellation)) and other contributors.

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

[![Build Status](https://secure.travis-ci.org/Constellation/esmangle.png)](http://travis-ci.org/Constellation/esmangle)
