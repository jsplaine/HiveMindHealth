describe('the api factory', function() {
  var fakeRes = {},
      fakeReq = {},
      results = {};

  fakeReq.body             = {},
  fakeReq.body.search_term = "tomatoes";
  
  it('has defined results', function() {
    fakeRes.json = function(data) {
      results = data;
    }

    var factoryResults = require('../api/factory');
    factoryResults(fakeReq, fakeRes);

    waitsFor(function() {
       return (results.length > 1);
    }, 'a results array with length > 0', 1500);

    expect(results).toBeDefined();
  });

  it('has defined results', function() {
    fakeRes.json = function(data) {
      results = data;
    }

    var factoryResults = require('../api/factory');
    factoryResults(fakeReq, fakeRes);

    waitsFor(function() {
       return (results.length > 1);
    }, 'a results array with length > 0', 1500);

    expect(results).toBeDefined();
  });

  it('returns an empty list when..', function() {

  });
});
