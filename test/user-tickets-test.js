"use strict";

var TestUtil     = require('./test-util');
var TestConst    = require('./test-const');
var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));

var DummyRobot   = require('./dummy-robot');
var targetScript = require("../src/scripts/hubot-pivotal");

describe("Test for user tickets feature", function() {

    // initial setup
    before(function(done) {
        TestUtil.commonBefore();
        done();
    });

    // teardown for each test
    afterEach(function(done) {
        TestUtil.commonAfterEach();
        done();
    });

    // test 
    it ("show user's all tickets.", function(done) {

    });

    it ("show user's all tickets (there is no user's ticket)", function(done) {
        fail();
    });
    
    it ("show user's all tickets w/o user info.", function(done) {
        fail();
    });

    it ("show user's all tickets w/o project info.", function(done) {
        fail();
    });

})