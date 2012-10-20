/*{
    "pass": [
        "hoist-variable-to-arguments"
    ]
}*/
(function () {
    arguments[0] = 20;
    var t =300;  // should not hoist to parameter
}());
