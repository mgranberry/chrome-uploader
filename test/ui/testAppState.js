/*
* == BSD2 LICENSE ==
* Copyright (c) 2014, Tidepool Project
*
* This program is free software; you can redistribute it and/or modify it under
* the terms of the associated License, which is identical to the BSD 2-Clause
* License as published by the Open Source Initiative at opensource.org.
*
* This program is distributed in the hope that it will be useful, but WITHOUT
* ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
* FOR A PARTICULAR PURPOSE. See the License for more details.
*
* You should have received a copy of the License along with this program; if
* not, you can obtain one from Tidepool Project at tidepool.org.
* == BSD2 LICENSE ==
*/

var _ = require('lodash');
var proxyquire = require('proxyquire').noCallThru();
var expect = require('salinity').expect;

describe('appState', function() {
  var config;
  var app;
  var appState;
  beforeEach(function() {
    config = {};
    app = {
      state: {},
      setState: function(updates) {
        this.state = _.assign(this.state, updates);
      }
    };

    appState = proxyquire('../../lib/state/appState', {
      '../config': config
    });
    appState.bindApp(app);
  });

  it('binds to app component', function() {
    app.state.FOO = 'bar';
    expect(appState.app.state.FOO).to.equal('bar');
  });

  describe('isLoggedIn', function() {

    it('returns true if there is a logged-in user object', function() {
      app.state.user = {userid: '11'};

      expect(appState.isLoggedIn()).to.be.true;
    });

    it('returns false if no logged-in user object', function() {
      app.state.user = null;

      expect(appState.isLoggedIn()).to.not.be.true;
    });

  });

  describe('currentUploadIndex', function() {

    it('returns index of upload in progress', function() {
      app.state.uploads = [
        {},
        {progress: {}}
      ];

      expect(appState.currentUploadIndex()).to.equal(1);
    });

    it('returns -1 if no upload in progress', function() {
      app.state.uploads = [
        {}
      ];

      expect(appState.currentUploadIndex()).to.equal(-1);
    });

    it('returns -1 if upload is complete', function() {
      app.state.uploads = [
        {progress: {finish: '2014-01-31T12:00:00Z'}}
      ];

      expect(appState.currentUploadIndex()).to.equal(-1);
    });

  });

  describe('hasUploadInProgress', function() {

    it('returns true if there is an upload in progress', function() {
      app.state.uploads = [
        {},
        {progress: {}}
      ];

      expect(appState.hasUploadInProgress()).to.be.true;
    });

    it('returns false if no upload in progress', function() {
      app.state.uploads = [];

      expect(appState.hasUploadInProgress()).to.not.be.true;
    });

  });

  describe('deviceCount', function() {

    it('returns number of uploads coming from a device', function() {
      app.state.uploads = [
        {source: {type: 'device'}},
        {source: {type: 'carelink'}}
      ];

      expect(appState.deviceCount()).to.equal(1);
    });

  });

  describe('uploadsWithFlags', function() {

    it('adds disabled flag to all uploads not in progress if one is in progress', function() {
      app.state.uploads = [
        {},
        {progress: {}}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(2);
      expect(uploads[0].disabled).to.be.ok;
      expect(uploads[1].disabled).to.not.be.ok;
    });

    it('adds disabled and disconnected flags to disconnected devices', function() {
      app.state.uploads = [
        {source: {type: 'device', connected: false}},
        {source: {type: 'device', connected: true}, progress: {}}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(2);
      expect(uploads[0].disabled).to.be.ok;
      expect(uploads[0].disconnected).to.be.ok;
      expect(uploads[1].disabled).to.not.be.ok;
      expect(uploads[1].disconnected).to.not.be.ok;
    });

    it('adds carelink flag to carelink uploads', function() {
      app.state.uploads = [
        {source: {type: 'carelink'}},
        {source: {type: 'device'}}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(2);
      expect(uploads[0].carelink).to.be.ok;
      expect(uploads[1].carelink).to.not.be.ok;
    });

    it('adds uploading flag to uploads in progress', function() {
      app.state.uploads = [
        {progress: {}},
        {progress: {finish: '2014-01-31T12:00:00Z'}},
        {}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(3);
      expect(uploads[0].uploading).to.be.ok;
      expect(uploads[1].uploading).to.not.be.ok;
      expect(uploads[2].uploading).to.not.be.ok;
    });

    it('adds fetchingCarelinkData flag to carelink upload just starting', function() {
      app.state.uploads = [
        {source: {type: 'carelink'}, progress: {step: 'start'}},
        {source: {type: 'device'}, progress: {step: 'start'}},
        {source: {type: 'carelink'}, progress: {step: 'start', finish: '2014-01-31T12:00:00Z'}},
        {source: {type: 'carelink'}, progress: {step: 'upload'}}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(4);
      expect(uploads[0].fetchingCarelinkData).to.be.ok;
      expect(uploads[1].fetchingCarelinkData).to.not.be.ok;
      expect(uploads[2].fetchingCarelinkData).to.not.be.ok;
      expect(uploads[3].fetchingCarelinkData).to.not.be.ok;
    });

    it('adds completed flag if current instance completed', function() {
      app.state.uploads = [
        {progress: {finish: '2014-01-31T12:00:00Z'}},
        {}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(2);
      expect(uploads[0].completed).to.be.ok;
      expect(uploads[1].completed).to.not.be.ok;
    });

    it('adds successful flag if current instance successful', function() {
      app.state.uploads = [
        {progress: {finish: '2014-01-31T12:00:00Z', success: true}},
        {}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(2);
      expect(uploads[0].successful).to.be.ok;
      expect(uploads[1].successful).to.not.be.ok;
    });

    it('adds failed flag if current instance failed', function() {
      app.state.uploads = [
        {progress: {finish: '2014-01-31T12:00:00Z', error: 'oops'}},
        {}
      ];

      var uploads = appState.uploadsWithFlags();
      expect(uploads).to.have.length(2);
      expect(uploads[0].failed).to.be.ok;
      expect(uploads[1].failed).to.not.be.ok;
    });

  });

});
