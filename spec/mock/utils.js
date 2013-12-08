/*
 * Mock resources setup utilities
 */

/*
 * @decription Create the mock fatSecretServer, and set the environmental
 *  variables necessary to force our fatsecret api to use it.
 *
 * @returns {Object}   the fat secret server object (contains only a
 *                      kill method);
 */

exports.setMockFatSecretServer = function() {
  var port = 99901;

  // tell our fatsecret object to use our mock server and keys
  process.env["FATSECRETKEYS"] = '{"api_key":"12345","shared_secret":"foo_bar"}';
  process.env["FATSECRETURL"]  = "http://localhost:" + port;

  // set a port for our mock server to use
  process.env["FATSECRETPORT"] = port;

  return require(__dirname + '/fatSecretServer');
}
