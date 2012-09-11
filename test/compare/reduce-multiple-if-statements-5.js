/*{
    "pass": [
        "reduce-multiple-if-statements",
        "remove-wasted-blocks"
    ]
}*/
for (;;) {
    if (cond) {
        if (cond2) {
            continue;
        }
        ok()  // This should not removed and translation should not occur.
    }
}
