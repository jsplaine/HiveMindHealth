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

var rest             = require('restler'),
    crypto           = require('crypto'),
    keys             = require('../../config/privatekeys').fatsecret,
    fatSecretRestUrl = require('../../config/resources').fatsecret.api_url,
    log              = require('log4js').getLogger();

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
 * @description FatSecret Constructor
 *
 * @param reqType {String}      the type of request we're making
 * @param searchTerm {String}   the search term
 */

var FatSecret = function(reqType, searchTerm) {
  // May want to delay this, we're not calling the API in
  //  this constructor
  var date = new Date;

  if (typeof(reqType) !== 'string' || typeof(searchTerm) !== 'string') {
    throw new Error("reqType and searchTerm are both mandatory String arguments");
  }

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

  // create the signature base string as per
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
   * @description post to FatSecret and return the results
   *
   * @param reqType {String}       the type of request we're making
   * @param searchTerm {String}    the search term
   * 
   * @return  {Object}             the search results; throws if response statusCode
   *                                ! /2??/
   */
  return {
    results: function(callb) {
      rest.post(fatSecretRestUrl, {
        data: reqObj,
      }).on('complete', function(content, response) {
        if (response.statusCode.toString().match(/2??/)) {
          callb(foodSearchAdapt(content));
        } else {
          throw "post failed with status code: " 
                + response.statusCode;
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
 * @param jsonRes {Object}  the FatSecret food object to translate
 * @return {Array}          the consumable (to the view layer) Array object
 */

function foodSearchAdapt(jsonRes) {

  var ret = [];

  if (jsonRes === undefined) {
    log.error("jsonRes is a required argument");
    return ret;
  }

  if (typeof jsonRes !== "object") {
    log.error("unexpected argument type: ");
    log.error(jsonRes);
    return ret;
  }

  if (jsonRes.foods === undefined 
      || jsonRes.foods.food === undefined 
      || jsonRes.foods.food.length === undefined) {
    // No food to objects to parse, something's wrong but let
    //  the view do it's thing (with nothing)
    log.error("unexpected response object");
    // log.error(JSON.stringify(jsonRes));
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
  
  ret[LOOKUP["food_id"]]   = foodObj.food_id    || undefined;
  ret[LOOKUP["food_name"]] = foodObj.food_name  || undefined;
  ret[LOOKUP["url"]]       = foodObj.food_url   || undefined;

  // Split a string like this (see below), into key value pairs that 
  // our caller will understand;
  // "Per 100g - Calories: 567kcal | Fat: 49.24g | Carbs: 16.13g | Protein: 25.80g"; 

  if (foodObj.food_description === undefined) {
    // There's nothing left to do if there's no nutrient info to parse
    log.warn("no nutrient info found for food_id: " + foodObj.food_id);
    return ret;
  }

  var tmp   = foodObj.food_description.split(/ - /);
  var unit  = tmp[0];
  var nutri = tmp[1];

  // split out unit and nutrient description
  ret.unit  = tmp[0], 
      nutri = tmp[1];

  // construct the nutrient portion of consumable object 
  tmp = nutri.split(/ \| /);
  for (var i = 0, len = tmp.length; i < len; i += 1) {     
    var tmp1 = tmp[i].split(/: /);
    if (tmp1.length !== 2) {
      log.error("skipping; can't parse: " + tmp[i]);
      continue;
    }
    var key = tmp1[0];
    var val = tmp1[1];
    
    if (LOOKUP[key] !== undefined) {
      ret[LOOKUP[key]] = val;    
    } else {
      // skip (and log), we don't know this k ey
      log.error("skipping; we don't know key: " + key);
      continue;
    }
  }

  return ret;
}

/*
 * Export our FatSecret Object
 */

module.exports = FatSecret;
