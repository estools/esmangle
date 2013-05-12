while (cond)
  // optimize it
  (function () {
    print('inner');
  }());
try { } catch (e) { print('hello'); }
