(function () {
  // not void context
  // do not optimize
  10 + (function () {
    return 200;
  }());
}());
