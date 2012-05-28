var request = require('request');
var async = require('async');
var url = require('url');
var fs = require('fs');

var OpenStackStorage = exports.OpenStackStorage = function (pAuthFunction, callback) {
  var self = this;
  self.authFn = pAuthFunction;
  self.tokens = {};
  self.authFn(function (err, res, tokens) {
    if(!err) {
      self.tokens = tokens;
//      console.log("setting tokens to ", tokens);
    }
    callback(err, res, tokens);
  });
};

OpenStackStorage.prototype.getFiles = function (containerName, callback) {
  var self = this;
//  console.log("tokens: ", self.tokens);
  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName);

//  console.log("targetURL: ", targetURL);
  request(
    {
      method: 'GET',
      uri: targetURL, 
      json: {},
      headers: {
        "X-Auth-Token": self.tokens.id,
        "Accept": "application/json"
      }
    },
    function (err, res, body) {
      if (!err && res && res.statusCode && res.statusCode >= 200 && res.statusCode <= 204) {
//        console.log("Successful return from getFiles: ", res.statusCode, 'body: ', body);
        var files = body;
        return callback(err, files);
      } else {
        if(!err) {
          err = new Error("request unsuccessful, statusCode: " + res.statusCode);
        }
        return callback(err, res.statusCode);
      }
    }
  );
};

OpenStackStorage.prototype.getContainers = function (callback) {
  var self = this;
  return self.getFiles("", callback);
};

OpenStackStorage.prototype.createContainer = function (containerName, callback) {
  var self = this;
//  console.log("tokens: ", self.tokens);
  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName);
//  console.log("targetURL: ", targetURL);
  request(
    {
      method: 'PUT',
      uri: targetURL, 
      json: {},
      headers: {
        "X-Auth-Token": self.tokens.id,
        "Accept": "application/json"
      }
    },
    function (err, res, body) {
      if (!err && res && res.statusCode && res.statusCode >= 200 && res.statusCode <= 204) {
        return callback(err, res.statusCode);
      } else {
        if(!err) {
          err = new Error("request unsuccessful, statusCode: " + res.statusCode);
        }
        return callback(err, res.statusCode);
      }
    }
  );
};

OpenStackStorage.prototype.deleteContainer = function (containerName, callback) {
  var self = this;
//  console.log("tokens: ", self.tokens);
  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName);
//  console.log("targetURL: ", targetURL);
  request(
    {
      method: 'DELETE',
      uri: targetURL, 
      json: {},
      headers: {
        "X-Auth-Token": self.tokens.id,
        "Accept": "application/json"
      }
    },
    function (err, res, body) {
      if (!err && res && res.statusCode && res.statusCode >= 200 && res.statusCode <= 204) {
        return callback(err, res.statusCode);
      } else {
        if(!err) {
          err = new Error("request unsuccessful, statusCode: " + res.statusCode);
        }
        return callback(err, res.statusCode);
      }
    }
  );
};

OpenStackStorage.prototype.deleteFile = function (containerName, remoteNameToDelete, callback) {
  var self = this;
  return self.deleteContainer(containerName + '/' + remoteNameToDelete, callback);
};

OpenStackStorage.prototype.addFile = function (containerName, fileToSend, callback) {
  var self = this;
  if(!fileToSend || !fileToSend.remoteName || (!fileToSend.localFile && !fileToSend.stream)) {
    return callback(new Error("must specify remoteName and either .localFile or .stream for file uploads"));
  }
//  console.log("tokens: ", self.tokens);
  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName + '/' + fileToSend.remoteName);
//  console.log("targetURL: ", targetURL);
  var headers = {
    "X-Auth-Token": self.tokens.id,
    "Accept": "application/json"
  }; 
  var fileStream = null;
  if(fileToSend.stream) {
    fileStream = fileToSend.stream;
  } else if (fileToSend.localFile) {
    headers['Content-Length'] = fs.statSync(fileToSend.localFile).size;
    fileStream = fs.createReadStream(fileToSend.localFile);
  }
  var uploadStream = request(
    {
      method: 'PUT',
      uri: targetURL, 
      headers: headers
    },
    function (err, res, body) {
      if (!err && res && res.statusCode && res.statusCode >= 200 && res.statusCode <= 204) {
        return callback(err, res.statusCode);
      } else {
        if(!err) {
          err = new Error("request unsuccessful, statusCode: " + res.statusCode);
        }
        return callback(err, res.statusCode);
      }
    }
  );
  fileStream.pipe(uploadStream);
};

