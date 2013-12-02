describe('the api factory', function() {
  var factoryResults = require('../api/factory'),
      alwaysInfo = ["print_name", "api_url", "api_url_link",
                    "site_url", "quote_attr"], 
      fakeRes = {}, 
      fakeReq = {}, 
      result;
    
  beforeEach(function() {
    result       = {};
    fakeReq.body = {};
    fakeRes.json = function(data) {
       result = data;
    };
  });
  
  it('has sanely populated results with a normal search', function() {
    runs(function() {
      fakeReq.body.search_term = "tomatoes";
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
      fakeReq.body.search_term = "somethingNonsensical";
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

  it('returns sane results quickly when the search_term'
      + ' is an empty string', function() {
    runs(function() {
      fakeReq.body.search_term = "";
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
});
