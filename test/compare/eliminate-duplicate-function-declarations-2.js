// Don't apply transformation to global code
function a() {
    console.log('ok1');
}
function a() {
    console.log('ok2');
}
a();
