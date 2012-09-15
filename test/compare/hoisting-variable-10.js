(function () {
    var a = 20;  // should hoist this
    (function () {
        arguments[0] = 20;
    }());
}());
