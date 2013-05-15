/*{
    "options": {
        "preserveCompletionValue": false
    }
}*/
switch (cond) {
  case 10:
    // do not optimize it
    (function () {
      print('ok');
    }());
}
