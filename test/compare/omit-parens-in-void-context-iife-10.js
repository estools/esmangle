while (cond) {
  try { } catch (e) { }
  // do not optimize it
  (function () {
    print('ok');
  }());
}
