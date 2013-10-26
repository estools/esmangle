// Do not optimize this pattern
function a() {
    console.log('ng');
}

{
    function a() {
        console.log('ng');
    }
    a();
    function a() {
        console.log('ok');
    }
}

a();

function a() {
    console.log('ok');
}
