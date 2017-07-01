"use strict";

var TestUtil     = require('./test-util');
var TestConst    = require('./test-const');
var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));

var DummyRobot   = require('./dummy-robot');
var targetScript = require("../src/scripts/hubot-pivotal");

describe("Test for user link/unlink feature", function() {

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

    it("link pivotal user by name.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = TestUtil.createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_ACCOUNT, testData);

        // test
        let reply = dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Done");
                    chai.expect(reply).to.have.string("111");
                    chai.expect(reply).to.have.string("Ieyasu Tokugawa");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.not.null;
                    chai.expect(storedUsersInfo[dummyRobot.userName]).to.be.not.null;
                    // #0 = Ieyasu
                    chai.expect(storedUsersInfo[dummyRobot.userName].pv_id).to.equal(testResponse[0]["person"]["id"]);
                    chai.expect(storedUsersInfo[dummyRobot.userName].pv_name).to.equal(testResponse[0]["person"]["name"]);
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("link pivotal user by initial.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = TestUtil.createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_ACCOUNT, testData);

        // test
        let reply = dummyRobot.testRun(targetScript,
            "link me with pivotal user HT",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Done");
                    chai.expect(reply).to.have.string("222");
                    chai.expect(reply).to.have.string("Hideyoshi Toyotomi");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.not.null;
                    chai.expect(storedUsersInfo[dummyRobot.userName]).to.be.not.null;
                    // #1 = HIdeyoshi
                    chai.expect(storedUsersInfo[dummyRobot.userName].pv_id).to.equal(testResponse[1]["person"]["id"]);
                    chai.expect(storedUsersInfo[dummyRobot.userName].pv_name).to.equal(testResponse[1]["person"]["name"]);
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("link pivotal user by username.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = TestUtil.createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_ACCOUNT, testData);

        // test
        let reply = dummyRobot.testRun(targetScript,
            "link me with pivotal user utsuke",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Done");
                    chai.expect(reply).to.have.string("333");
                    chai.expect(reply).to.have.string("Nobunaga Oda");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.not.null;
                    chai.expect(storedUsersInfo[dummyRobot.userName]).to.be.not.null;
                    // #2 = Nobunaga
                    chai.expect(storedUsersInfo[dummyRobot.userName].pv_id).to.equal(testResponse[2]["person"]["id"]);
                    chai.expect(storedUsersInfo[dummyRobot.userName].pv_name).to.equal(testResponse[2]["person"]["name"]);
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("link pivotal user twice.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = TestUtil.createTestResponseForLinkUser();
        // for 1st response
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });
        // for 2nd response
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_ACCOUNT, testData);

        // test
        let userName1 = dummyRobot.userName;
        dummyRobot.testRun(targetScript, "link me with pivotal user utsuke");
        dummyRobot.userName = "bob";
        let userName2 = dummyRobot.userName;
        dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Done");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.not.null;
                    chai.expect(storedUsersInfo[dummyRobot.userName]).to.be.not.null;
                    // #2 = Nobunaga
                    chai.expect(storedUsersInfo[userName1].pv_id).to.equal(testResponse[2]["person"]["id"]);
                    chai.expect(storedUsersInfo[userName1].pv_name).to.equal(testResponse[2]["person"]["name"]);
                    // #0 = Nobunaga
                    chai.expect(storedUsersInfo[userName2].pv_id).to.equal(testResponse[0]["person"]["id"]);
                    chai.expect(storedUsersInfo[userName2].pv_name).to.equal(testResponse[0]["person"]["name"]);
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("link pivotal user by linked user.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = TestUtil.createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_ACCOUNT, testData);
        let registeredData = {};
        registeredData[dummyRobot.userName] = {
            pv_id   : "999",
            pv_name : "Masamune Date"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_USERS, registeredData);

        // test
        dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.not.have.string("Done");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.not.null;
                    let userData = storedUsersInfo[dummyRobot.userName];
                    chai.expect(userData).to.be.not.null;
                    // Should keep original data
                    chai.expect(userData.pv_id).to.equal(registeredData[dummyRobot.userName].pv_id);
                    chai.expect(userData.pv_name).to.equal(registeredData[dummyRobot.userName].pv_name);
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("link pivotal user by unknown user.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = TestUtil.createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_ACCOUNT, testData);

        // test
        let reply = dummyRobot.testRun(targetScript,
            "link me with pivotal user Matthew Calbraith Perry",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Could not find");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.null;
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("link pivotal user fail.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockError(() => {
            return new Error('dummy errro.');
        });
        
        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_ACCOUNT, testData);

        // test
        let reply = dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("An error occurred during get pivotal member info");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.null;
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("link pivotal user w/ empty account info.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = [{id: 7777777}];
        // for 1st response
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        // for 2nd response
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(TestUtil.createTestResponseForLinkUser());
        });

        // test
        dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Done");
                    // brain
                    let storedAccountInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_ACCOUNT);
                    chai.expect(storedAccountInfo).to.be.not.null;
                    chai.expect(storedAccountInfo.id).to.equal(testResponse[0].id)
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it ("unlink pivotal user by linked user.", function(done) {
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
            "unlink me from pivotal user",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Done");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.null;
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it ("unlink pivotal user by not linked user.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let registeredData = {};
        registeredData["Hanako"] = {
            pv_id   : "111",
            pv_name : "Ieyasu Tokugawa"
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_USERS, registeredData);

        // test
        dummyRobot.testRun(targetScript,
            "unlink me from pivotal user",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("already unlinked");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(TestConst.BRAIN_KEY_USERS);
                    chai.expect(storedUsersInfo).to.be.not.null;
                    let userData = storedUsersInfo["Hanako"];
                    chai.expect(userData).to.be.not.null;
                    // Should keep original data
                    chai.expect(userData.pv_id).to.equal(registeredData["Hanako"].pv_id);
                    chai.expect(userData.pv_name).to.equal(registeredData["Hanako"].pv_name);
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });
});