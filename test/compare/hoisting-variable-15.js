// Currently not optimize for-in with initializer
(function () {
    for (var i = 10 in []);
}());
