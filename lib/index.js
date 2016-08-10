/*
 * Bedrock Agreement Module.
 *
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
/* jshint node:true */
'use strict';

var async = require('async');
var bedrock = require('bedrock');
var brPermission = require('bedrock-permission');
var database = require('bedrock-mongodb');
var eventLog = require('bedrock-event-log').log;
var BedrockError = bedrock.util.BedrockError;
var uuid = require('uuid').v4;

// load config defaults
require('./config');

bedrock.events.on('bedrock.test.configure', function() {
  require('./test.config');
});

// module permissions
var PERMISSIONS = bedrock.config.permission.permissions;

// module API
var api = {};
module.exports = api;

var logger = bedrock.loggers.get('app');

/**
 * Add an AgreementAccept event.
 *
 * @param actor the Identity performing the action.
 * @param agreements a string or array of strings referencing agreements.
 * @param callback(err, result) called once the operation completes.
 */
api.accept = function(actor, agreements, callback) {
  if(!actor || !('id' in actor)) {
    return callback(new TypeError(
      'actor must be an object with an "id" property.'));
  }
  if(typeof agreements === 'string') {
    agreements = [agreements];
  } else if(!Array.isArray(agreements)) {
    return callback(new TypeError(
      'agreements parameter must be a string or an array.'));
  }
  var event = {
    type: 'AgreementAccept',
    date: new Date().toJSON(),
    resource: agreements,
    actor: actor.id
  };
  async.auto({
    checkPermission: function(callback) {
      brPermission.checkPermission(
        actor, PERMISSIONS.AGREEMENT_ACCEPT,
        {resource: event, translate: 'actor'}, callback);
    },
    insert: ['checkPermission', function(callback) {
      eventLog.add(event, callback);
    }]
  }, function(err, results) {
    if(err) {
      return callback(err);
    }
    callback(null, results.insert);
  });
};

/**
 * Get all agreements accepted by an actor.
 *
 * @param actor the Identity performing the action.
 * @param callback(err, result) called with an error or an array of agreements.
 */
api.getAccepted = function(actor, identityId, callback) {
  if(!actor || !('id' in actor)) {
    return callback(new TypeError(
      'actor must be an object with an "id" property.'));
  }
  var query = {
    typeSpecific: database.hash(identityId),
    'event.type': 'AgreementAccept'
  };
  async.auto({
    checkPermission: function(callback) {
      brPermission.checkPermission(
        actor, PERMISSIONS.AGREEMENT_ACCESS,
        {resource: identityId}, callback);
    },
    find: ['checkPermission', function(callback) {
      eventLog.find(query, function(err, records) {
        if(err) {
          return callback(err);
        }
        var rValue = records.reduce(function(a, b) {
          return a.concat(b.event.resource);
        }, []);
        // during callback, make sure rValue has unique values only
        callback(null, Array.from(new Set(rValue)));
      });
    }]
  }, function(err, results) {
    callback(err, results.find);
  });
};
