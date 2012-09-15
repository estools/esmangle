(function() {
    var i = 20;
    with (obj) {
        i, 10, 20;  // 'i' should remain
    }
}());
