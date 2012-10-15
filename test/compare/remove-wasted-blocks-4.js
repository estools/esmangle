function test() {
    while (cond) {
        {
            ok();
            ok();
            var i = 20;
        }
        {
            ok();
        }
    }
}
