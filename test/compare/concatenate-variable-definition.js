(function() {
  // https://github.com/Constellation/esmangle/issues/65
  var a = 42;
  var b = 16;
  var c = 11;
  var x = [].slice.call(arguments);
  return [a, b, c, d];
}());
