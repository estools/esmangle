/*{
    "pass": [
        "transform-to-compound-assignment"
    ]
}*/
(function () {
    var i;
    eval('i');
    function t() {
        i = i += 10;  // eval makes dynamic
    }
}());
