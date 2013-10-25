(function () {
    function a() {
        console.log('ok1');
    }
    {
        function a() {
            console.log('ok2');
        }
    }
}());
