(function () {
    switch (cond) {
        case 10:
            print("HELLO");
        default:
            // drop this default clause
            // https://github.com/mishoo/UglifyJS2/issues/141
    }
}());
