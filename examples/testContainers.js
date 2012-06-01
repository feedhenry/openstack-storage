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
  var containers = storageSwift.getContainers(function(err, containers) {
    console.log('getCOntainers - err: ', err, ', containers: ', containers);
    async.forEachSeries(
      containers,
      function (container, containerCB) {
        storageSwift.getFiles(container.name, function (err, files) {
          console.log('in container: ', container.name, ', got files: ', files);
          return containerCB();
        });
      },
      function (err) {
        console.log('async complete - err: ', err);
        storageSwift.createContainer("EngTest", function (err, statusCode) {
          console.log('after createContainer - err: ', err, ", statusCode: ", statusCode);
          storageSwift.putFile("EngTest", {remoteName:'file1.png', localFile:'./test.png'}, function(err, statusCode) {
            console.log('after putFile - err: ', err, ", statusCode: ", statusCode);
            storageSwift.deleteFile("EngTest", 'file1.png', function (err, statusCode) {
              console.log('after deleteFile - err: ', err, ", statusCode: ", statusCode);
              storageSwift.deleteContainer("EngTest", function (err, statusCode) {
                console.log('after deleteContainer - err: ', err, ", statusCode: ", statusCode);
              });
            });
          });
        });
      }
    );
  });
});

