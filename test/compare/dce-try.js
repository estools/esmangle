(function() {
    try {
        throw 'test';
    } catch (e) {
    }
    ok();  // This must not be removed.
}());
