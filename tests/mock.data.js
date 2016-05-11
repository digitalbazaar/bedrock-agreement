/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */
 /* jshint node: true */

'use strict';

var helpers = require('./helpers');

var data = {};
module.exports = data;

var identities = data.identities = {};
var userName;

// identity with permission to access its own agreements
userName = 'regularUser';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(userName);
identities[userName].identity.sysResourceRole.push({
  sysRole: 'bedrock-agreement.test',
  generateResource: 'id'
});

// identity with no permissions
userName = 'noPermission';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(userName);
