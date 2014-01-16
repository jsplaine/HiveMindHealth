/*
 * API Factory
 */

/*
 * Dependencies
 */

var fatSecret = require('./fatsecret/fatsecret'),
    reddit    = require('./reddit/reddit'),
    log       = require('log4js').getLogger(),
    resources = require('../config/resources');

/*
 * Constants
 */

// The APIs and their Objects
var APIs = {
  // FatSecret
  fatsecret : {
    obj:    fatSecret,
    info:   resources.fatsecret
  },
  // Reddit
  reddit : {
    obj:    reddit,
    info:   resources.reddit 
  },
  // Wikipedia
  wikipedia : {
    obj:    undefined,
    info:   resources.wikipedia 
  }
};

/*
 * @description get each API name and info object
 *
 * @param req {Object} the request object
 * @param res {Object} the response object
 */

var getInfo = function(req, res) {
  var info = [];
  for (var i in APIs) {
    info.push({ name: i, data: APIs[i].info});
  }
  res.json(info);
}

/*
 * @description get results from calls to all the APIs
 *
 * @param req {Object} the request object
 * @param res {Object} the response object
 */

var getResults = function(req, res) {
  var searchTerm = req.params.searchTerm || undefined,
      apiName    = req.params.apiName    || undefined,
      result     = { results: [] };

  // both searchTerm and apiName are mandatory params
  if (searchTerm === undefined || apiName === undefined ) {
    log.warn("bad params!", req.params);
    res.json(result);
    return;
  }

  var api = APIs[apiName] || undefined;

  // the controller is in a bad state if this happens
  if (api === undefined) {
    log.warn("the api requested does not exist:", apiName);
    res.json(result);
    return;
  }

  // skip if there's no object to use for this API
  if (api.info.active !== true) {
    log.info(apiName, "is disabled");
    res.json(result);
    return;
  }

  try {
    var apiObj = api.obj("search", searchTerm);
    log.debug("searchTerm:", searchTerm);

    apiObj.get(function(r) {
      result.results = r;
      res.json(result);
    });
  } catch (e) {
    res.json(result);
    log.error(api.name + " request failed:", e);
    log.debug("request was:", req, " response was:", res);
  }
}

/*
 * Export our results function
 */

module.exports.getResults = getResults;
module.exports.getInfo    = getInfo;
