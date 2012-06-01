var request = require('request');
var async = require('async');
var url = require('url');
var fs = require('fs');

var auth = require('./authenticate');
exports.authenticate = auth.getTokens;

var OpenStackStorage = exports.OpenStackStorage = function (pAuthFunction, callback) {
  var self = this;
  self.authFn = pAuthFunction;
  self.tokens = {};
  self.authFn(function (err, res, tokens) {
    if(!err) {
      self.tokens = tokens;
    }
    callback(err, res, tokens);
  });
};

OpenStackStorage.prototype.getFiles = function (containerName, callback) {
  var self = this;
  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName);

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
  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName);

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
  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName);

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

OpenStackStorage.prototype.putFile = function (containerName, fileToSend, callback) {
  var self = this;
  if(!fileToSend || !fileToSend.remoteName || (!fileToSend.localFile && !fileToSend.stream)) {
    return callback(new Error("must specify remoteName and either .localFile or .stream for file uploads"));
  }

  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName + '/' + fileToSend.remoteName);

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

OpenStackStorage.prototype.getFile = function (containerName, fileToReceive, callback) {
  var self = this;
  if(!fileToReceive || !fileToReceive.remoteName || (!fileToReceive.localFile && !fileToReceive.stream)) {
    return callback(new Error("must specify remoteName and either .localFile or .stream for file downloads"));
  }

  var targetURL = url.parse(self.tokens.storageUrl + '/' + containerName + '/' + fileToReceive.remoteName);

  var headers = {
    "X-Auth-Token": self.tokens.id
  }; 
  var fileStream = null;
  if(fileToReceive.stream) {
    fileStream = fileToReceive.stream;
  } else if (fileToReceive.localFile) {
    fileStream = fs.createWriteStream(fileToReceive.localFile);
  }
  var downloadStream = request(
    {
      method: 'GET',
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
  downloadStream.pipe(fileStream);
};

