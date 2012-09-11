/*{
    "pass": [
        "reduce-multiple-if-statements",
        "remove-wasted-blocks"
    ]
}*/
// Surpress reducing because of alternate
for (;;) {
    if (cond) {
        if (cond2) {
            continue;
        }
    } else {
        ;
    }
}
