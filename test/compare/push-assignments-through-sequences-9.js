(function () {
    var i = 20;
    with (obj) {
        i + (a(), b(), c());  // do not transform
    }
}());
