describe('the api factory', function() {
  var alwaysInfo = ["print_name", "api_url", "api_url_link",
                    "site_url", "quote_attr"], 
      fakeRes    = {}, 
      fakeReq    = {};

  // setup the mock FatSecret server
  var mockServer = require(__dirname + '/mock/utils').setMockFatSecretServer(),
      serverUp   = true;

  var factoryResults = require('../api/factory');

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
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 2000);  

    runs(function() {
      // some results
      expect(result.results.length).toBeGreaterThan(0);

      // an api_info object
      expect(result.api_info).toEqual(jasmine.any(Object));

      // expected api_info fields
      var info = result.api_info;
      for (var i in alwaysInfo) {
        expect(info[alwaysInfo[i]]).toBeDefined();
      }

      // currently have just this one api
      expect(info.print_name).toEqual("FatSecret");
    });
  });

  it('provides an empty result set with a nonsensical search'
      + ' but still provides expected api_info', function() {
    runs(function() {
      fakeReq.params.searchTerm = "somethingNonsensical";
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 2000);  

    runs(function() {
      // empty results
      expect(result.results.length).toEqual(0);

      // an api_info object
      expect(result.api_info).toEqual(jasmine.any(Object));

      // expected api_info fields
      var info = result.api_info;
      for (var i in alwaysInfo) {
        expect(info[alwaysInfo[i]]).toBeDefined();
      }

      // currently have just this one api
      expect(info.print_name).toEqual("FatSecret");
    });
  });

  it('returns sane results quickly when the searchTerm'
      + ' is an empty string', function() {
    runs(function() {
      fakeReq.params.searchTerm = "";
      factoryResults(fakeReq, fakeRes);
    });

    waitsFor(function() {
      return (typeof result.results === "object");
    }, 'results', 100);  

    runs(function() {
      // empty results
      expect(result.results.length).toEqual(0);

      // no api_info object
      expect(result.api_info).toBeUndefined();
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
