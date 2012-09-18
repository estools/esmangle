(function(){
  var x;
  return function(){
    return typeof x === 'undefined';
  };
}());
