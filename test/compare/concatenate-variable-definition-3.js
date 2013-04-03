/*{
    "pass": [
        "concatenate-variable-definition"
    ]
}*/
function ok() {
  // do not concat i=20,i2=30
  var i = 20;
  test();
  var i2 = 30;
}
