/*{
    "options": {
        "preserveCompletionValue": true
    }
}*/
(function () {
    function test() {
        (function () {
            print('inner');
        }());
    }
    test();
}());
