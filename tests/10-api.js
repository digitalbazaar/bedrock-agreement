/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
 /* globals describe, before, after, it, should, beforeEach, afterEach */
 /* jshint node: true */
'use strict';

var async = require('async');
var bedrock = require('bedrock');
var brAgreement = require('..');
var database = require('bedrock-mongodb');
var helpers = require('./helpers');
var mockData = require('./mock.data');
var uuid = require('uuid').v4;

describe('accept API', function() {
  beforeEach(function(done) {
    helpers.removeCollection('eventLog', done);
  });

  it('adds an event for one agreement specified as a string', function(done) {
    var agreements = uuid();
    var actor = mockData.identities.regularUser.identity;
    async.auto({
      insert: function(callback) {
        brAgreement.accept(actor, agreements, function(err, result) {
          should.not.exist(err);
          should.exist(result);
          result.should.be.an('object');
          callback(err, result);
        });
      },
      test: ['insert', function(callback, results) {
        database.collections.eventLog.find({
          'event.id': results.insert.event.id
        }).toArray(function(err, result) {
          should.not.exist(err);
          should.exist(result);
          result.should.be.an('array');
          result.should.have.length(1);
          should.exist(result[0].typeSpecific);
          result[0].typeSpecific.should.equal(database.hash(actor.id));
          should.exist(result[0].event);
          var event = result[0].event;
          event.should.be.an('object');
          should.exist(event.type);
          event.type.should.equal('AgreementAccept');
          should.exist(event.date);
          event.date.should.be.a('string');
          should.exist(event.resource);
          event.resource.should.be.an('array');
          event.resource.should.have.length(1);
          event.resource[0].should.equal(agreements);
          should.exist(event.actor);
          event.actor.should.equal(actor.id);
          should.exist(event.id);
          event.id.should.be.a('string');
          callback();
        });
      }]
    }, done);
  });
  it('adds an event for four agreements specified as an array', function(done) {
    var agreements = [];
    for(var i = 0; i < 4; i++) {
      agreements.push(uuid());
    }
    var actor = mockData.identities.regularUser.identity;
    async.auto({
      insert: function(callback) {
        brAgreement.accept(actor, agreements, callback);
      },
      test: ['insert', function(callback, results) {
        database.collections.eventLog.find({
          'event.id': results.insert.event.id
        }).toArray(function(err, result) {
          should.not.exist(err);
          var event = result[0].event;
          should.exist(event.resource);
          event.resource.should.be.an('array');
          event.resource.should.have.length(4);
          event.resource.should.deep.equal(agreements);
          callback();
        });
      }]
    }, done);
  });
  it('returns error if no AGREEMENT_ACCEPT permission', function(done) {
    var agreements = uuid();
    var actor = mockData.identities.noPermission.identity;
    brAgreement.accept(actor, agreements, function(err) {
      should.exist(err);
      err.name.should.equal('PermissionDenied');
      err.details.sysPermission.should.equal('AGREEMENT_ACCEPT');
      done();
    });
  });
  it('returns an error if agreements is not a string or array');
  it('returns an error if actor is not a valid identity');
}); // end add

describe('getAccepted API', function() {
  beforeEach(function(done) {
    helpers.removeCollection('eventLog', done);
  });

  it('returns one agreement from one event', function(done) {
    var agreements = uuid();
    var actor = mockData.identities.regularUser.identity;
    async.auto({
      insert: function(callback) {
        brAgreement.accept(actor, agreements, callback);
      },
      getAccepted: ['insert', function(callback) {
        brAgreement.getAccepted(actor, actor.id, callback);
      }],
      test: ['getAccepted', function(callback, results) {
        var result = results.getAccepted;
        result.should.be.an('array');
        result.should.have.length(1);
        result.should.include(agreements);
        callback();
      }]
    }, done);
  });
  it('returns four agreements from one event', function(done) {
    var agreements = [];
    for(var i = 0; i < 4; i++) {
      agreements.push(uuid());
    }
    var actor = mockData.identities.regularUser.identity;
    async.auto({
      insert: function(callback) {
        brAgreement.accept(actor, agreements, callback);
      },
      getAccepted: ['insert', function(callback) {
        brAgreement.getAccepted(actor, actor.id, callback);
      }],
      test: ['getAccepted', function(callback, results) {
        var result = results.getAccepted;
        result.should.be.an('array');
        result.should.have.length(4);
        result.should.deep.equal(agreements);
        callback();
      }]
    }, done);
  });
  it('returns two agreements from two events', function(done) {
    var agreementsAlpha = uuid();
    var agreementsBeta = uuid();
    var actor = mockData.identities.regularUser.identity;
    async.auto({
      insertAlpha: function(callback) {
        brAgreement.accept(actor, agreementsAlpha, callback);
      },
      insertBeta: function(callback) {
        brAgreement.accept(actor, agreementsBeta, callback);
      },
      getAccepted: ['insertAlpha', 'insertBeta', function(callback) {
        brAgreement.getAccepted(actor, actor.id, callback);
      }],
      test: ['getAccepted', function(callback, results) {
        var result = results.getAccepted;
        result.should.be.an('array');
        result.should.have.length(2);
        result.should.deep.equal([agreementsAlpha, agreementsBeta]);
        callback();
      }]
    }, done);
  });
  it('returns five agreements from two events', function(done) {
    var agreementsAlpha = uuid();
    var agreementsBeta = [];
    for(var i = 0; i < 4; i++) {
      agreementsBeta.push(uuid());
    }
    var allAgreements = bedrock.util.clone(agreementsBeta);
    allAgreements.unshift(agreementsAlpha);
    var actor = mockData.identities.regularUser.identity;
    async.auto({
      insertAlpha: function(callback) {
        brAgreement.accept(actor, agreementsAlpha, callback);
      },
      insertBeta: ['insertAlpha', function(callback) {
        brAgreement.accept(actor, agreementsBeta, callback);
      }],
      getAccepted: ['insertBeta', function(callback) {
        brAgreement.getAccepted(actor, actor.id, callback);
      }],
      test: ['getAccepted', function(callback, results) {
        var result = results.getAccepted;
        result.should.be.an('array');
        result.should.have.length(5);
        result.should.deep.equal(allAgreements);
        callback();
      }]
    }, done);
  });
  it('returns error if no AGREEMENT_ACCESS permission', function(done) {
    var agreements = uuid();
    var actor = mockData.identities.noPermission.identity;
    brAgreement.getAccepted(actor, actor.id, function(err) {
      should.exist(err);
      err.name.should.equal('PermissionDenied');
      err.details.sysPermission.should.equal('AGREEMENT_ACCESS');
      done();
    });
  });
}); // end get
