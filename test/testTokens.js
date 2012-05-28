// Arguments parser
var args = require('optimist').argv;

// Logger Library
var winston = require('winston');

var dateFormat = require('dateformat');

// Usage
function usage() {
  console.error("Usage: " + args.$0 + " <config file>");
  process.exit(0);
}

if(args.h) {
  usage();
}

if(args._.length != 1) {
  usage(); 
}

var configFile = args._[0];
var config = require(configFile);

var authenticate = require('authenticate');

var res = authenticate.getTokens(config, function (err, res, tokens) {
  console.log("err: ", err);
//  console.log("res: ", res);
  console.log("tokens: ", tokens);
});




