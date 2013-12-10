/*
 * API Factory
 */

/*
 * Dependencies
 */

var fatSecret = require('./fatsecret/fatsecret'),
    log       = require('log4js').getLogger();

/*
 * Constants
 */

// The APIs and their Objects
var APIs = [
  { name: 'fatsecret',
    obj: fatSecret,
    info: require('../config/resources').fatsecret }
];

/*
 * @description get results from calls to all the APIs
 *
 * @param req {Object} the request object
 * @param res {Object} the response object
 */

var getResults = function(req, res) {
  var searchTerm = req.params.searchTerm || undefined;
  var result     = { results: [], api_info: {} };

  if (searchTerm === undefined) {
    log.debug("req.params.searchTerm empty");
    result.api_info = undefined;
    res.json(result);
    return;
  }

  for (var i = 0, apiCt = APIs.length; i < apiCt; i++) {
    var apiInfo = APIs[i].info;
    try {
      var api = APIs[i].obj("search", searchTerm);
      api.get(function(r) {
        result.results  = r;
        result.api_info = apiInfo;
        res.json(result);
      });
    } catch (e) {
      res.send(404, APIs[i].name + " request failed");
      log.error(APIs[i].name + " request failed:", e);
      log.debug("request was:", req, " response was:", res);
    }
  }
}

/*
 * Export our results function
 */

module.exports = getResults;
