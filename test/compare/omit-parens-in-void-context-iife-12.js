/*{
    "options": {
        "preserveCompletionValue": false
    }
}*/
for (var i = 20; i < 200; ++i)
  // do not optimize it
  (function () {
    print('ok');
  }());
