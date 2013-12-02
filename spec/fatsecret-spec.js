// ToDo: Refactor fatsecret.js with the ability to run offline with mocks
// ToDo: Replace this spec with a standard RESTfulness validator
describe('FatSecret without calling the api factory', function() {
  var FatSecret        = require('../api/fatsecret/fatsecret'),
      populatedResults = ['id', 'title', 'url', 'unit', 'calories', 
                          'fat', 'carbs', 'protein'],
      callB, 
      results;

  beforeEach(function() {
    results = undefined;
    callB   = function(data) {
      results = data;
    };
  });

  it("with a normal search term, provides sane, well munged results", 
    function() {
      runs(function() {
        var getFunc = FatSecret('search', 'bananas');
        getFunc.get(callB);
      });

      waitsFor(function() {
        return(results !== undefined);
      }, 'a result', 2000);
      
      runs(function() {
        expect(results.length).toBeGreaterThan(0);
        // expect that the API was able to munge all the results
        for (var i in results) {
          for (var j in populatedResults) {
            var field = populatedResults[j];
            expect(results[i][field].length).toBeGreaterThan(0);
          }
        }
      });
  });

  it("returns an empty list given a nonsensical search term", function() {
    runs(function() {
      var getFunc = FatSecret('search', 'nonsensicalSearchTerm');
      getFunc.get(callB);
    });

    waitsFor(function() {
      return(results !== undefined);
    }, 'a result', 2000);
    
    runs(function() {
      expect(results.length).toEqual(0);
    });
  });

  it("can handle spaces in search", function() {
    runs(function() {
      var getFunc = FatSecret('search', '   hot   dogs ');
      getFunc.get(callB);
    });

    waitsFor(function() {
      return(results !== undefined);
    }, 'a result', 2000);
    
    runs(function() {
      expect(results.length).toBeGreaterThan(0);
    });
  });

  it("throws when searchTerm is an empty string", function() {
    var shouldThrow = function() {
      var getFunc = FatSecret('search', '');
    };
    
    expect(shouldThrow).toThrow('searchTerm cannot be an empty string');
  });

  it("throws when passed wrong type or missing arguments", function() {
    var wrongType = function() {
      var getFunc = FatSecret('search', {});
    };

    var missing = function() {
      var getFunc = FatSecret(undefined, 'foo');
    };
    
    expect(wrongType).toThrow(
      'reqType and searchTerm are both mandatory String arguments'
    );
    expect(missing).toThrow(
      'reqType and searchTerm are both mandatory String arguments'
    );
  });
});
