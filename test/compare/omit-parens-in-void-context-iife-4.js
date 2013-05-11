(function () {
    function test() {
        (function () {
            print('inner');
        }());
    }
    test();
}());
