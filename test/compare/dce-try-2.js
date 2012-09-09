(function() {
    try {
        throw 'test';
    } finally {
        ok();
    }
    ng();  // This should be removed.
}());
