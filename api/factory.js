/*
 * API Factory
 */

/*
 * Dependencies
 */

var fatSecret = require('./fatsecret/fatsecret');

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
 * @description APIFactory
 *
 * @param api {Object}          the type of request we're making
 * @param reqType {String}      the type of request we're making
 * @param searchTerm {String}   the search term
 */

var APIFactory = function(apiObj, reqType, searchTerm) {
  if (typeof(searchTerm) !== 'string' || typeof(reqType) !== 'string' ) {
    throw new Error("searchTerm and reqType are mandatory String arguments");
  }
  return apiObj(reqType, searchTerm);
}

/*
 * @description get results from calls to all the APIs
 *
 * @param req {Object} the request object
 * @param res {Object} the response object
 */

var getResults = function(req, res) {
  var searchTerm = req.body.search_term,
      apiCt      = APIs.length; 

  for (var i = 0; i < apiCt; i++) {
    var apiInfo = APIs[i].info;
    APIFactory(APIs[i].obj, "search", searchTerm).results(function(r) {
      res.json({ results: r, api_info: apiInfo });
    });
  }
}

/*
 * Export our results function
 */

module.exports = getResults;