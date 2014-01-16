'use strict';

/*
 * Reddit API object for HiveMindHealth
 */

/*
 * Dependencies
 */

var log            = require('log4js').getLogger(),
    request        = require('request'),
    searchPath     = "search.json?q=",
    afterQueryPath = "&sort=top&restrict_sr=on&t=all#page=1";

var baseUrl = process.env.REDDITURL // for testing
              || require('../../config/resources').reddit.api_url;

log.info("Reddit URL:", baseUrl);

/*
 * Constants
 */

// Map of request types to 3rd party API action/string/method
var REQ_TYPES = {
  "search" : "search.json?q="
};

// the subreddits to query
var SUBREDDITS = [ 
  "health",
  "nutrition",
  "alternativehealth",
  "vegetarian"
];

var subredditPath = "r/" + SUBREDDITS.join("+");

/*
 * @description Reddit Constructor.  Throws if the arguments are
 *  missing or malformed, including when searchTerm is an empty string.
 *
 * @param searchTerm {String}   the search term
 */

var Reddit = function(reqType, searchTerm) {

  if (typeof(reqType) !== 'string' || typeof(searchTerm) !== 'string') {
    log.error("Unexpected Reddit() args, reqType:", 
              reqType, "searchTerm:", searchTerm);
    throw new Error("reqType and searchTerm are both mandatory String arguments");
  }

  if (searchTerm.length === 0) {
    throw new Error("searchTerm cannot be an empty string");
  }

  // trim leading/trailing spaces
  searchTerm = searchTerm.replace(/^\s+|\s+$/g, '');
  // spaces get replaced with plus signs
  searchTerm = searchTerm.replace(/\s+/g, '+');

  var reqUrl = baseUrl            + '/' + 
               subredditPath      + '/' + 
               REQ_TYPES[reqType] + 
               searchTerm         +
               afterQueryPath;

  /*
   * @description return an object containing a get function which
   *  passes search results to a given callback method.
   * 
   * @return  {Object}        Object containing a function which calls the
   *                            Reddit API
   */

  return {
    get: function(callB) {
      request(reqUrl, function (error, response, body) {
        if (! error) {
          callB(redditSearchAdapt(JSON.parse(body)));
        } else {
          log.error("get request to", reqUrl, "failed with", error);
        }
      });
    }
  };
}

/*
 * Utils
 */

/*
 * @description Given a json response, return a view-consumable object
 *
 * @param jsonRes {Object}     the FatSecret food object to translate
 * @param searchTerm {String}  the search term
 *
 * @return {Array}             the consumable (to the view layer) Array object
 */

function redditSearchAdapt(jsonRes, searchTerm) {

  var ret = [];

  if (jsonRes === undefined || typeof jsonRes !== "object") {
    log.error("jsonRes is a required argument and must be an object");
    return ret;
  }

  if (typeof jsonRes.data === undefined || jsonRes.data.children === undefined) {
    log.error("unexpected JSON reddit response", jsonRes);
    return ret;
  }

  for (var post in jsonRes.data.children) {
    ret.push(translateRedditPost(jsonRes.data.children[post].data));
  }

  return ret;
}

/*
 * @description Given a json response, return a view-consumable object
 *
 * @param foodObj {Object}  the FatSecret food object to translate
 * @return {Object}         the consumable (to the view layer) food object
 */

function translateRedditPost(post) {
  var ret      = {};
  
  ret["url"]   = post.url   || undefined;
  ret["title"] = post.title || undefined;

  return ret;
}

/*
 * Export our Reddit Object
 */

module.exports = Reddit;
