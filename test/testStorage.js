var path = require('path');
var assert = require('assert');
var async = require('async');
var fs = require('fs');
var buffertools = require('buffertools');

var authenticate = require('../lib/authenticate');
var storage = require('../lib/storage');

var testLocalFile = '/tmp/test.txt';
var testLocalFile2 = '/tmp/test2.txt';
var testRemoteFileName = 'file1.txt';
var fileDataToSend = 'This is test data\nLine 2 of test data\n';

suite('StorageTests', function(){
  var configFile;
  var config;
  var authFn;

  setup(function(done){
    configFile = path.join(__dirname,'../config/testconfig.json');
    async.series([
      function (cb) {
        path.exists(configFile, function (configPresent) {
          var err;
          if (configPresent) {
            config = require(configFile);
            authFn = async.apply(authenticate.getTokens, config);
          } else {
            err = new Error('config file: ' + configFile + ' not found. Did you create one based on the sample provided?');
          }
          cb(err);
        });
      },
      function (cb) {
        fs.writeFile(testLocalFile, fileDataToSend, cb);
      }
    ], function (err) {
      done(err);
    });
  });        

  suite('Create Container, then file, then delete both', function(){
    test('happy test', function(done){
      var storageSwift = new storage.OpenStackStorage (authFn, function(err, res, tokens) {
        assert(!err);
        assert(tokens);
        async.waterfall(
          [
            function(cb) {
              var containerName = "EngTest" + Date.now(); // use a container name that's unlikely to exist 
              cb(null, containerName);
            },
            function(containerName, cb) {
              storageSwift.createContainer(containerName, function (err, statusCode) {
                assert(!err, "error creating container");
                assert(statusCode, "no statusCode");
                assert((statusCode >= 200) && (statusCode < 300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              // send a file from the local filesystem
              storageSwift.putFile(containerName, {remoteName: testRemoteFileName, localFile: testLocalFile}, function(err, statusCode) {
                assert(!err, "error sending file");
                assert(statusCode, "no statusCode");
                assert((statusCode >= 200) && (statusCode < 300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              // receive the file, sent previously, as a stream, and compare it to the file data
              var receiverStream = new buffertools.WritableBufferStream();
              storageSwift.getFile(containerName, {remoteName: testRemoteFileName, stream: receiverStream}, function(err, statusCode) {
                assert(!err, "error receiving file");
                assert(statusCode, "no statusCode");
                assert((statusCode >= 200) && (statusCode < 300), "non successful statusCode: " + statusCode);
                var receivedData = receiverStream.getBuffer().toString('utf8');
                assert.strictEqual(receivedData, fileDataToSend, "Sent and received data should match");
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              // send the file as a stream
              var sendingStream = fs.createReadStream(testLocalFile);
              storageSwift.putFile(containerName, {remoteName: testRemoteFileName, stream: sendingStream}, function(err, statusCode) {
                assert(!err, "error sending file");
                assert(statusCode, "no statusCode");
                assert((statusCode >= 200) && (statusCode < 300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              // receive the file just sent and compare
              var receiverStream = new buffertools.WritableBufferStream();
              storageSwift.getFile(containerName, {remoteName: testRemoteFileName, localFile: testLocalFile2}, function(err, statusCode) {
                assert(!err, "error sending file");
                assert(statusCode, "no statusCode");
                assert((statusCode >= 200) && (statusCode < 300), "non successful statusCode: " + statusCode);
                var receivedData = fs.readFileSync(testLocalFile2, 'utf8');
                assert.strictEqual(receivedData, fileDataToSend, "Sent and received data should match");
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              // delete the remote file
              storageSwift.deleteFile(containerName, testRemoteFileName, function (err, statusCode) {
                assert(!err, "error deleting file");
                assert(statusCode, "no statusCode");
                assert((statusCode >= 200) && (statusCode < 300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            },
            function(containerName, cb) {
              // delete the remote container
              storageSwift.deleteContainer(containerName, function (err, statusCode) {
                assert(!err, "error deleting container");
                assert(statusCode, "no statusCode");
                assert((statusCode >= 200) && (statusCode < 300), "non successful statusCode: " + statusCode);
                cb(err, containerName);
              });
            }
          ],
          function(err, containerName) {
            assert(!err, "Previous asserts have succeeded, unexpected error: " + (err?err.toString():""));
            done();
          }
        );
      });
    });
  });
});

