'use strict';

// ToDo: Replace this spec with a standard RESTfulness validator
describe('FatSecret without calling the api factory', function() {
  var populatedResults = ['id', 'title', 'url', 'unit', 'calories', 
                          'fat', 'carbs', 'protein'],
      callB, 
      results;

  // setup the mock FatSecret server
  var mockServer = require(__dirname + '/mock/utils').setMockFatSecretServer(),
      serverUp   = true;
  
  var FatSecret  = require(__dirname + '/../../api/fatsecret/fatsecret');

  beforeEach(function() {
    results = undefined;
    callB  = function(data) {
      results = data;
    };
  });

  it("with a normal search term, provides sane, well munged results", 
    function() {
      runs(function() {
        var getFunc = FatSecret('search', 'banana');
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
    }
  );

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

  // tear-down the mock server
  runs(function() {
    mockServer.kill(function() {
      serverUp = false;
    });
  });

  waitsFor(function() {
    return(serverUp === false);
  }, 'the mock server to cleanup', 1000);
});
