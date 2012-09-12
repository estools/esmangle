/*{
    "pass": [
        "transform-to-compound-assignment"
    ]
}*/
(function () {
    var i;
    with (obj) {
        i;
    }
    i = i += 10;  // This should be reduce
}());
