(function() {
    throw 'test';
    with (obj);  // This should be removed.
}());
