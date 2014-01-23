'use strict';

/*
 * Reddit API object for HiveMindHealth
 */

/*
 * Dependencies
 */

var log            = require('log4js').getLogger(),
    apiName        = "reddit",
    request        = require('request'),
    allHtmlEnt     = require('html-entities').XmlEntities;

// Contains decode() method for html entity decodeing
var htmlEntities = new allHtmlEnt;

/*
 * Constants
 */

// The subreddits to query
var SUBREDDITS = [ 
  "nutrition",
  "foodscience",
  "askscience",
  "youshouldknow"
];

// The base URL
var BASEURL = process.env.REDDITURL // for testing
              || require('../../config/resources').reddit.api_url;
log.info("Reddit URL:", BASEURL);

// Various reddit subpaths
var SUBPATHS = {
   afterQuery   : "&restrict_sr=on&t=all",
   search       : "search.json?q=",
   subreddits   : "r/" + SUBREDDITS.join("+")
};

// Map of request types to 3rd party API action/string/method
var REQ_TYPES = {
  "search" : SUBPATHS.search
};

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

  var reqUrl = BASEURL             + '/' + 
               SUBPATHS.subreddits + '/' + 
               REQ_TYPES[reqType]  + 
               searchTerm          +
               SUBPATHS.afterQuery;

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
  var ret = {};
 
  // set consumable fields

  ret.url       = post.url       || undefined;
  ret.title     = post.title     || undefined;
  ret.upvotes   = post.ups       || undefined;
  ret.subreddit = post.subreddit || undefined;
  ret.text      = post.selftext_html 
    // decode html entities
    ? htmlEntities.decode(post.selftext_html)
    : undefined;
  ret.subreddit_link = post.subreddit 
    ? BASEURL + "/r/" + post.subreddit 
    : undefined;

  ret.type = apiName;

  return ret;
}

/*
 * Export our Reddit Object
 */

module.exports = Reddit;
