(function () {
    var obj = { };
    with (obj) {
        (0, test)();  // Don't transform it to test()
    }
/*
 * var obj = {
 *   test: function() {
 *     print(obj === this);
 *   }
 * };
 * with (obj) {
 *   test();  // true
 *   (0, test)();  // false
 * }
 */
}());
