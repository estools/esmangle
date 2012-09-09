(function() {
    try {
        throw 'test';
    } catch (e) {
    } finally {
        return 0;
    }
    ok();  // This should be removed.
}());
