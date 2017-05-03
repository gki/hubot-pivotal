"use strict";

var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));

var DummyRobot   = require('./dummy-robot');
var targetScript = require("../src/hubot-pivotal");

describe("Test for hubot-pivotal.js", function() {

    let backupProjectIds;
    // initial setup
    before(function(done) {
        backupProjectIds = process.env.PROJECT_IDS;
        done();
    });

    // teardown for each test
    afterEach(function(done) {
        if (!backupProjectIds) {
            // revert to undefined.
            delete process.env.PROJECT_IDS;
        } else {
            process.env.PROJECT_IDS = backupProjectIds;
        }
        done();
    });

    // test 
    it("Check response for 'hello'", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        // test
        let reply = dummyRobot.testRun(targetScript, "hello");

        // check
        // chai.expect(dummyRobot.respond).to.have.been.called();
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.equal("world!");
    });

    // test 
    it("Check response for 'Nice to meet you'", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        // test
        let reply = dummyRobot.testRun(targetScript, "Nice to meet you");

        // check
        chai.expect(spyRespond.called).to.not.be.ok;
        chai.expect(reply).to.be.undefined;
    });

    // test 
    it("Check  for 'show pivotal projects' w/ multiple project ids.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        process.env.PROJECT_IDS = "1111,2222,3333";
        // test
        let TEST_PROJECT_IDS = process.env.PROJECT_IDS.split(',');
        let reply = dummyRobot.testRun(targetScript, "show pivotal projects");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        let urls = reply.split('\n');
        // empty line will be added at last.
        chai.expect(urls).to.have.length(TEST_PROJECT_IDS.length + 1);
        for (let index in urls) {
            if (urls[index].length == 0) {
                continue; // skip empty line
            }
            chai.expect(urls[index]).to.endsWith(TEST_PROJECT_IDS[index])
        }
    });

    // test 
    it("Check  for 'show pivotal projects' w/ sigle project id.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        process.env.PROJECT_IDS = "1111";
        // test
        let TEST_PROJECT_IDS = process.env.PROJECT_IDS.split(',');
        let reply = dummyRobot.testRun(targetScript, "show pivotal projects");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        let urls = reply.split('\n');
        // empty line will be added at last.
        chai.expect(urls).to.have.length(TEST_PROJECT_IDS.length + 1);
        for (let index in urls) {
            if (urls[index].length == 0) {
                continue; // skip empty line
            }
            chai.expect(urls[index]).to.endsWith(TEST_PROJECT_IDS[index])
        }
    });

    // test 
    it("Check  for 'show pivotal projects' w/ no project ids.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        delete process.env.PROJECT_IDS;

        // test
        let reply = dummyRobot.testRun(targetScript, "show pivotal projects");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.be.singleLine;
        chai.expect(reply).to.not.contain("http");
    });

});
