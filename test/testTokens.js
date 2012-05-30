var path = require('path');
var assert = require('assert');
var authenticate = require('../lib/authenticate');

suite('authenticate', function(){
  var configFile;
  var config;

  setup(function(){
    configFile = path.join(__dirname,'../config/testconfig.json');
    config = require(configFile);
  });

  suite('getTokens', function(){
    test('happy test', function(done){
      var res = authenticate.getTokens(config, function (err, res, tokens) {
        assert(!err, "Error from getToken: " + (err?err.toString():""));
        assert(tokens, "Invalid response from authentication");
        assert(tokens.id && (tokens.id.length > 0), "id should be a string");
        assert(tokens.expires && (tokens.expires.length > 0), "invalid expiry time returned");
        assert(tokens.storageUrl && (tokens.storageUrl.length > 0), "storageURL not returned");
        done();
      });
    });
  });
});


