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

var async = require('async');
var storage = require('storage');

var authFn = async.apply(storage.authenticate, config);
var storageSwift = new storage.OpenStackStorage (authFn, function(err, res, tokens) {
  console.log('Storage constructor - err: ', err, ', tokens: ', tokens);
  storageSwift.deleteFile("EngTest", 'file1.png', function (err, statusCode) {
    console.log('after deleteFile - err: ', err, ", statusCode: ", statusCode);
    storageSwift.deleteContainer("EngTest", function (err, statusCode) {
      console.log('after deleteContainer - err: ', err, ", statusCode: ", statusCode);
    });
  });
});
