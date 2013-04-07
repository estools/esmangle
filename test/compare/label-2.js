// Do not mangle to the same name
test: {
    test2: {
        print("HELLO");
        if (cond) {
            break test2;
        }
        break test;
    }
}
