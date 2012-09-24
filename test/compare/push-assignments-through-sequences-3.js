(function () {
    with (obj) {
        p = (f(), 20);  // getter is not observable after f()
    }
}());
