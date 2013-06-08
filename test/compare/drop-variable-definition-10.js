/*{
    "options": {
        "preserveCompletionValue": true
    }
}*/
// reported from issue #60
void function () {
  var foo;  // this foo should be dropped
  foo = function () {  // this should be transformed to non-assignment expression
    return 99;
  };
}.call(this);
