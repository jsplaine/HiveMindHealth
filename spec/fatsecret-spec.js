describe('fatsecret without calling the api factory', function() {
  var fatSecret = require('../api/fatsecret/fatsecret');
  
  var getResultsFunc;

  it("should initially return an object, with a public results function", 
    function() {
      getResultsFunc = fatSecret('search', 'bananas');
      expect(typeof getResultsFunc).toEqual('object');
      expect(typeof getResultsFunc.results).toEqual('function');
    }
  );

  it("which returns an object result", function() {
    var res = [];
    getResultsFunc.results(function(resArray) {
      res = resArray;
    });

    waitsFor(function() {
      return (typeof res === "object");
    }, "a results object", 1500);

    expect(res).toBeDefined();
  });
});
