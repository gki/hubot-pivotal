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
        fail();
    });

    it ("show user's all tickets (there is no user's ticket)", function(done) {
        fail();
    });
    
    it ("show user's all tickets w/o user info.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        // test
        dummyRobot.testRun(targetScript,
            "show my pivotal tickets",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("no liked pivotal user");
                    chai.expect(reply).to.not.have.string("Done");
                    chai.expect(reply).to.not.have.string("http");
                    chai.expect(reply).to.not.have.string("point");

                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it ("show user's all tickets w/o project info.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let registeredData = {};
        registeredData[dummyRobot.userName] = {
            pv_id   : "111",
            pv_name : "Ieyasu Tokugawa"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_USERS, registeredData);

        // test
        dummyRobot.testRun(targetScript,
            "show my pivotal tickets",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("no project info");
                    chai.expect(reply).to.not.have.string("Done");
                    chai.expect(reply).to.not.have.string("http");
                    chai.expect(reply).to.not.have.string("point");

                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

})