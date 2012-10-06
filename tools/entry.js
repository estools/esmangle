global.esmangle = require('../lib/esmangle');
(function () {
    // entry points
    require('../lib/pass/hoist-variable-to-arguments');
    require('../lib/pass/transform-dynamic-to-static-property-access');
    require('../lib/pass/transform-dynamic-to-static-property-definition');
    require('../lib/pass/transform-immediate-function-call');
    require('../lib/pass/reordering-function-declarations');
    require('../lib/pass/remove-unused-label');
    require('../lib/pass/remove-empty-statement');
    require('../lib/pass/remove-wasted-blocks');
    require('../lib/pass/transform-to-compound-assignment');
    require('../lib/pass/transform-to-sequence-expression');
    require('../lib/pass/transform-branch-to-expression');
    require('../lib/pass/transform-typeof-undefined');
    require('../lib/pass/reduce-sequence-expression');
    require('../lib/pass/reduce-branch-jump');
    require('../lib/pass/reduce-multiple-if-statements');
    require('../lib/pass/dead-code-elimination');
    require('../lib/pass/remove-side-effect-free-expressions');
    require('../lib/pass/remove-context-sensitive-expressions');
    require('../lib/pass/tree-based-constant-folding');
    require('../lib/post/transform-static-to-dynamic-property-access');
    require('../lib/post/transform-infinity');
    require('../lib/post/rewrite-boolean');
    require('../lib/post/rewrite-conditional-expression');
});
