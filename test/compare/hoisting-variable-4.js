(function () {
    var t = 300;  // should not hoist to parameter
    with (obj) {
        arguments = 20;
    }
}());
