/*{
    "options": {
        "preserveCompletionValue": true
    }
}*/
if (cond) {
  try { } catch (e) { }
  // do not optimize it
  (function () {
    print('ok');
  }());
} else {
  try { } catch (e) { }
  // do not optimize it
  (function () {
    print('ok');
  }());
}
