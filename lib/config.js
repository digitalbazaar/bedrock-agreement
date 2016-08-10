/*
 * Copyright (c) 2016 Digital Bazaar, Inc. All rights reserved.
 */

var config = require('bedrock').config;
require('bedrock-permission');
require('bedrock-event-log');

// permissions
var permissions = config.permission.permissions;
permissions.AGREEMENT_ACCESS = {
  id: 'AGREEMENT_ACCESS',
  label: 'Access Agreement',
  comment: 'Required to access an Agreement.'
};
permissions.AGREEMENT_ACCEPT = {
  id: 'AGREEMENT_ACCEPT',
  label: 'Accept Agreement',
  comment: 'Required to accept an Agreement.'
};

// configure event logging module
config['event-log'].eventTypes.AgreementAccept = {
  index: 'actor'
};
