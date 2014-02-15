'use strict';

/*
 * FatSecret API object for HiveMindHealth
 *
 * Request signing explanation: 
 *   http://platform.fatsecret.com/api/Default.aspx?screen=rapiauth
 */

/*
 * Dependencies
 */

var rest    = require('restler'),
    crypto  = require('crypto'),
    log     = require('log4js').getLogger(),
    apiName = "fatsecret",
    keys;

// for testing, we recognize a FATSECRETKEYS variable
if (typeof process.env.FATSECRETKEYS === 'string') {
  keys = JSON.parse(process.env.FATSECRETKEYS);
} else {
  keys = require('../../config/privatekeys')[apiName];
}

var fatSecretRestUrl = process.env.FATSECRETURL // for testing
                    || require('../../config/resources')[apiName].api_url;

log.info("FatSecret URL:", fatSecretRestUrl);

/*
 * Constants
 */

// The types of requests we handle
var REQ_TYPES = {
  'search': 'foods.search'
  // TODO food: 'food'
};

// Parsing translation
var LOOKUP = {
    Calories:  "calories",
    Carbs:     "carbs",
    Fat:       "fat",
    Protein:   "protein",
    food_id:   "id",
    food_name: "title",
    url:       "url"
};

/*
 * @description FatSecret Constructor.  Throws if the arguments are
 *  missing or malformed, including when searchTerm is an empty string.
 *
 * @param reqType {String}      the type of request we're making
 * @param searchTerm {String}   the search term
 */

var FatSecret = function(reqType, searchTerm) {
  // May want to delay date creation, we're not calling the API in
  //  this constructor.  Though fatSecret seems to only care that 
  //  our subsequent dates are of greater value.
  var date = new Date;

  if (typeof(reqType) !== 'string' || typeof(searchTerm) !== 'string') {
    log.error("Unexpected FatSecret() args, reqType:", 
              reqType, "searchTerm:", searchTerm);
    throw new Error("reqType and searchTerm are both mandatory String arguments");
  }

  if (searchTerm.length === 0) {
    throw new Error("searchTerm cannot be an empty string");
  }

  // trim leading/trailing spaces
  searchTerm = searchTerm.replace(/^\s+|\s+$/g, '');
  // spaces get replaced with hyphens
  searchTerm = searchTerm.replace(/\s+/g, '-');

  // Note that the keys stay in alphabetical order
  var reqObj = {
    format:                 'json',
    method:                 REQ_TYPES[reqType],
    oauth_consumer_key:     keys.api_key,
    oauth_nonce: Math.random().toString(36).replace(/[^a-z]/, '').substr(2),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        Math.floor(date.getTime() / 1000),
    oauth_version:          '1.0',
    search_expression:      searchTerm
  };

  // Construct the oauth_signature

  // construct a param=value& string and uriEncode
  var paramsStr = '';
  for (var i in reqObj) {
    paramsStr += "&" + i + "=" + reqObj[i];
  }
  // yank off that first "&"
  paramsStr = paramsStr.substr(1);

  // create the signature base string
  var sigBaseStr = "POST&"
                 + encodeURIComponent(fatSecretRestUrl)
                 + "&"
                 + encodeURIComponent(paramsStr);

  // no Access Token token
  // (we don't yet support FatSecret user acct related actions)
  var sharedSecret = keys.shared_secret + "&";

  // finally, the full constructed oauth_signature
  var hashedBaseStr  = crypto.createHmac('sha1', sharedSecret)
                       .update(sigBaseStr).digest('base64');

  // Add oauth_signature to the request object
  reqObj.oauth_signature = hashedBaseStr;

  /*
   * @description return an object containing a get method which
   *  passes search results to a given callback.
   * 
   * @return  {Object}        Object containing a function which calls the
   *                            FatSecret API
   */

  return {
    get: function(callb) {
      rest.post(fatSecretRestUrl, {
        data: reqObj,
      }).on('complete', function(content, response) {
        if (typeof(response) !== "undefined" && response.statusCode.toString().match(/2??/)) {
          callb(foodSearchAdapt(content, searchTerm));
        } else {
          // XXX This could fill disk space ..
          log.error("response.statusCode !~ /2??/, response:" + response);
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
 * @return {Array}             the consumable (to the view layer) Array object
 */

function foodSearchAdapt(jsonRes, searchTerm) {

  var ret = [];

  if (jsonRes === undefined) {
    log.error("jsonRes is a required argument");
    return ret;
  }

  if (typeof jsonRes !== "object") {
    log.error("jsonRes is not an object: ", jsonRes);
    return ret;
  }

  // If there's no foods object, something's amiss
  if (jsonRes.foods === undefined) {
    log.error("unexpected response object: ", jsonRes);
    return ret; 
  }

  // At this point, no food object means that no matching 
  //  food was found
  if (jsonRes.foods.food === undefined) {
    log.debug("no results found for:", searchTerm);
    return ret;
  }

  for (var i in jsonRes.foods.food) {
    ret.push(translateFoodObj(jsonRes.foods.food[i]));
  }

  return ret;
}

/*
 * @description Given a json response, return a view-consumable object
 *
 * @param foodObj {Object}  the FatSecret food object to translate
 * @return {Object}         the consumable (to the view layer) food object
 */

function translateFoodObj(foodObj) {
  var ret = {};

  // Set consumable fields
  
  ret.brand = foodObj.brand_name || undefined;
  ret.title = foodObj.food_name  || undefined;
  ret.url   = foodObj.food_url   || undefined;

  ret.type = apiName; 

  if (foodObj.food_description === undefined) {
    // There's nothing left to do if there's no nutrient info to parse
    log.warn("no nutrient info found for food_id: " + foodObj.food_id);
    return ret;
  }

  // split out unit and nutrient description
  var tmp   = foodObj.food_description.split(/ - /);

  ret.unit  = tmp[0];
  ret.nutri = tmp[1];

  return ret;
}

/*
 * Export our FatSecret Object
 */

module.exports = FatSecret;
