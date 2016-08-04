/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
/* jshint node: true */
'use strict';

var async = require('async');
var config = require('bedrock').config;
var database = require('bedrock-mongodb');
var uuid = require('uuid').v4;

var api = {};
module.exports = api;

api.createIdentity = function(userName) {
  var newIdentity = {
    id: 'did:' + uuid(),
    type: 'Identity',
    sysSlug: userName,
    label: userName,
    email: userName + '@bedrock.dev',
    sysPassword: 'password',
    sysPublic: ['label', 'url', 'description'],
    sysResourceRole: [],
    url: 'https://example.com',
    description: userName,
    sysStatus: 'active'
  };
  return newIdentity;
};

api.removeCollection = function(collection, callback) {
  var collectionNames = [collection];
  database.openCollections(collectionNames, function(err) {
    async.each(collectionNames, function(collectionName, callback) {
      database.collections[collectionName].remove({}, callback);
    }, function(err) {
      callback(err);
    });
  });
};
