/*{
    "options": {
        "preserveCompletionValue": false
    }
}*/
with (cond)
  // do not optimize it
  (function () {
    print('ok');
  }());
