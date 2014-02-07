// To avoid JSC bug, we don't distinguish FunctionExpression name scope and it's function scope
(function name() {
    var testing = 20;  // Don't rename this variable to a name that is the same to function's name
    print(testing);
}());
