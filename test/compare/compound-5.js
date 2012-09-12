/*{
    "pass": [
        "transform-to-compound-assignment"
    ]
}*/
(function () {
    var i = 0;
    with (obj) {
        i += i += 10;  // 'i' lookup can be observed by obj's getter.
    }
}());
