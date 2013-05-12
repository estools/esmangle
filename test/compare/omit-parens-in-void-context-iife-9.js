if (cond) {
  try { print('try'); } catch (e) {}
  // do not optimize it
  (function () {
    print('ok');
  }());
}
