/*{
    "pass": [
        "transform-to-compound-assignment"
    ],
    "post": []
}*/
(function () {
    i = i += 10;  // This is global varible, so observable by getter.
}());
