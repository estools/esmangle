(function () {
    // 'b'
    test: {
        if (c) break test;
        // 'a'
        test1: {
            if (c) break test1;
            if (c) break test1;
            if (c) break test1;
        }
        // 'a'
        test1: {
            if (c) break test1;
            if (c) break test1;
            if (c) break test1;
        }

    }
}());
