if (cond) {
  // optimize it
  (function () {
    print('inner');
  }());
  try {
    print("HELLO");
  } catch (e) {
  }
}
