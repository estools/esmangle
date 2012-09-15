(function () {
    var a = 20;  // should not hoist this
    arguments[0] = 20;
    (function () {
        eval('');
    }());
}());
