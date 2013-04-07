(function () {
    // 'a'
    test: {
        if (c) break test;
        (function () {
            // 'a'
            test: {
                if (c) break test;
                print("HELLO");
            }
        }());
    }
}());
