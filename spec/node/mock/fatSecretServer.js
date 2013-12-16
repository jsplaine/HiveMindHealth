/*
 * Mock FatSecret server
 *
 * XXX find more unique real-world FatSecret server responses
 *  like 'bad oauth signature', and create tests proving we can
 *  can handle them.
 *
 * note: process.env.FATSECRETPORT must be set.
 */

/*
 * dependencies
 */

var express      = require('express'),
    log          = require('log4js').getLogger(),
    port         = process.env.FATSECRETPORT,
    mockResults  = require(__dirname + '/fatSecretResults');

if (typeof port === "undefined") {
  throw new Error("FATSECRETPORT must be set");
}

/*
 * create server
 */

var app = express();

app.use(express.urlencoded());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, 
                               showStack:      true }));

// Error handling defined last
app.use(function(err, req, res, next){
  log.error(err.stack);
  res.send(500, 'Something broke!');
});

/*
 * routes
 */

app.post('*', function(req, res) {
  log.debug("req.body.search_expression:", req.body.search_expression);
  
  var mockResults = getSearchResults(req.body.search_expression);
  res.json(mockResults.data);
  res.send(mockResults.statusCode);
});

/*
 * listen 
 */

var srv = app.listen(port, function() {
  log.info("Mock FatSecret server running on port:", port);
});

/*
 * Kill server
 *
 * @param {Object} callB   a callback function to call when the server 
 *                         is done closing
 */

module.exports = {
  kill: function(callb) {
    log.info("killing Mock FatSecret server");
    srv.close(callb);
  }
};

/*
 * @description Given a searchTerm, does a lookup against our mockResults
 *   hash and returns a results object, example:
 *    { statusCode: 200, data: { <the body of the json response> } }
 *
 * @param {String} searchTerm    the search term to look up
 * 
 * @returns {Object}             an object containing a statusCode and json data
 */

function getSearchResults(searchTerm) {
  log.info("Looking for", searchTerm, "mock results");
  var results = {};

  if (mockResults[searchTerm]) {
    results.data       = mockResults[searchTerm].data;
    results.statusCode = mockResults[searchTerm].statusCode;
  } else {
    // use nonsensicalSearchTerm mock result
    results.data       = mockResults["nonsensicalSearchTerm"].data;
    results.statusCode = 200;
  }

  return results;
};
