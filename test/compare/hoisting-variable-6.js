(function () {
    var a = 20;  // hoist this, but it is very difficult.
    (function () {
        eval('');
    }());
}());
