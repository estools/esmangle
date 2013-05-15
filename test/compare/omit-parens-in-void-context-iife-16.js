/*{
    "options": {
        "preserveCompletionValue": true
    }
}*/
try {
  // do not optimize it
  (function () {
    print('ok');
  }());
} catch (e) {
  // do not optimize it
  (function () {
    print('ok');
  }());
} finally {
  // do not optimize it
  (function () {
    print('ok');
  }());
}
