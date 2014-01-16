'use strict';

// XXX use mock data; these tests break when we add/enable/disable production apis

// getInfo method tests

describe("the api factory's getResults method", function() {
  var fakeRes = {}, 
      fakeReq = {},
      result;

  // setup the mock FatSecret server
  var mockServer = require(__dirname + '/mock/utils').setMockFatSecretServer(),
      serverUp   = true;

  var factoryResults = require(__dirname + '/../../api/factory').getResults;

  beforeEach(function() {
    result         = {};
    fakeReq.params = {};
    fakeRes.json   = function(data) {
      result = data;
    };
  });

  it('has sanely populated results with a successful search', function() {
    runs(function() {
      fakeReq.params.searchTerm = "banana";
      fakeReq.params.apiName    = "fatsecret";
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 2000);  

    runs(function() {
      // some results
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  it('provides an empty result set with a nonsensical search term', function() {
    runs(function() {
      fakeReq.params.searchTerm = "somethingNonsensical";
      fakeReq.params.apiName    = "fatsecret";
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 2000);  

    runs(function() {
      // empty results
      expect(result.results.length).toEqual(0);
    });
  });

  it('provides an empty result set with a nonexistent api', function() {
    runs(function() {
      fakeReq.params.searchTerm = "banana";
      fakeReq.params.apiName    = "crazyAPI";
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 2000);  

    runs(function() {
      // empty results
      expect(result.results.length).toEqual(0);
    });
  });

  it('provides an empty result set with a disabled api', function() {
    runs(function() {
      fakeReq.params.searchTerm = "banana";
      fakeReq.params.apiName    = "wikipedia";
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 2000);  

    runs(function() {
      // empty results
      expect(result.results.length).toEqual(0);
    });
  });

  it('returns sane results quickly when the searchTerm'
      + ' is an empty string', function() {
    runs(function() {
      fakeReq.params.searchTerm = "";
      fakeReq.params.apiName    = "fatsecret";
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 100);  

    runs(function() {
      // empty results
      expect(result.results.length).toEqual(0);
    });
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

// getInfo method tests

describe("the api factory's getInfo method", function() {
  var fakeRes    = {}, 
      fakeReq    = {},
      getApiInfo = require(__dirname + '/../../api/factory').getInfo,
      result;

  beforeEach(function() {
    result         = [];
    fakeReq.params = {};
    fakeRes.json   = function(data) {
      result = data;
    };
  });

  it('has sanely populated results', function() {
    runs(function() {
      getApiInfo(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (result.length > 0);
    }, 'results', 100);  

    runs(function() {
      expect(result.length).toEqual(3); // the current API count
      expect(result[0].data).toEqual(jasmine.any(Object));
      expect(result[0].name).toEqual(jasmine.any(String));
    });
  });
});
