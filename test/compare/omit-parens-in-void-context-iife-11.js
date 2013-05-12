for (var i in obj)
  // do not optimize it
  (function () {
    print('ok');
  }());
