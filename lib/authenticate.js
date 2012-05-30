var request = require('request');
var async = require('async');
var url = require('url');

var defaults = {
  openstackIdentityTokens: "/v2.0/tokens"
};

/*
 * Authenticate with Keystone, getting auth token and the storageURL to use for Swift
 *
 * options:
 *  {
 *    "auth": {
 *      "passwordCredentials": {
 *        "username": "feedhenry",
 *        "password":"PASSWORD"
 *      }
 *    },
 *    host: "https://lon.identity.api.rackspacecloud.com",
 *    storageName: "cloudFiles"
 *  }
 *
 *
 * callback(err, tokens)
 *   where tokens is:
 *     {
 *       id:          // the token
 *       expires:     // expiry time/dat of token
 *       storageUrl:  // the url to use for accessing storage
 *     }
 */
var getTokens = exports.getTokens = function (options, callback) {
  var uri = url.parse(options.host);
  uri.pathname = defaults.openstackIdentityTokens;
  var targetURL = url.format(uri);
  request(
    {
      method: 'POST',
      uri: targetURL, 
      json: {"auth": options.auth},
      headers: {"Accept": "application/json"}
    },
    function (err, res, body) {
      var tokens = {};
      if (!err && res && res.statusCode && res.statusCode === 200) {
        var respBody = body;
        tokens.id = respBody.access.token.id;
        tokens.expires = respBody.access.token.expires;
        async.detect(
          respBody.access.serviceCatalog,
          function (item, cb) {
            var doesMatch = (item.type === 'object-store') && (item.name === options.storageName);
            return cb(doesMatch);
          },
          function (matchingItem) {
            if(matchingItem && matchingItem.endpoints && matchingItem.endpoints[0] && matchingItem.endpoints[0].publicURL) {
              tokens.storageUrl = matchingItem.endpoints[0].publicURL;
            } else {
              err = new Error("storageURL not available");
            }
            return callback(err, res, tokens);
          }
        );
      } else {
        if(!err) {
          err = new Error("request unsuccessful, statusCode: " + res.statusCode);
        }
        return callback(err, res, tokens);
      }
    }
  );
};