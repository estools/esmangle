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
    }
}
