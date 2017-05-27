"use strict";

var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));

var DummyRobot   = require('./dummy-robot');
var targetScript = require("../src/scripts/hubot-pivotal");

describe("Test for hubot-pivotal.js", function() {

    let backupProjectIds;
    let BRAIN_KEY_PROJECTS = 'projects_info';

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
    it("Check for 'show pivotal projects' w/ multiple project ids.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        // process.env.PROJECT_IDS = "1111,2222,3333";
        let testData = {
            1111 : {
                name: 'project A',
                url: 'http//test/a',
                description: 'description for A'
            },
            2222 : {
                name: 'project B',
                url: 'http//test/b',
                description: 'description for B'
            },
            3333 : {
                name: 'project C',
                url: 'http//test/c',
                description: 'description for C'
            }
        }

        dummyRobot.brain.set(BRAIN_KEY_PROJECTS, testData);
        // test
        let reply = dummyRobot.testRun(targetScript, "show pivotal projects");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        let lines = reply.split('\n');
        // empty line will be added at last.
        chai.expect(lines).to.have.length(Object.keys(testData).length * 3 + 1);
    });

    // test 
    it("Check for 'show pivotal projects' w/ sigle project id.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testData = {
            1111 : {
                name: 'project A',
                url: 'http//test/a',
                description: 'description for A'
            }
        };
        dummyRobot.brain.set(BRAIN_KEY_PROJECTS, testData);

        // test
        let reply = dummyRobot.testRun(targetScript, "show pivotal projects");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        let lines = reply.split('\n');
        // empty line will be added at last.
        chai.expect(lines).to.have.length(4);
        for (let index in lines) {
            chai.expect(lines[0]).to.include((testData[1111])['name']);
            chai.expect(lines[0]).to.include(testData[1111]['url']);
            chai.expect(lines[1]).to.include(testData[1111]['description']);
            chai.expect(lines[2]).to.have.length(0);
            chai.expect(lines[3]).to.have.length(0);
        }
    });

    // test 
    it("Check for 'show pivotal projects' w/ no project ids.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        // test
        let reply = dummyRobot.testRun(targetScript, "show pivotal projects");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.be.singleLine;
        chai.expect(reply).to.not.contain("http");
    });

    // test addProjectName
    it("Check for addProjectName w/ unknown project id.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.setHttpResponseMock(() => {
            // no "name" in response Json.
            return '{"foo":"bar"}';
        });

        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "add pivotal project #12345678",
            function (reply) {
                // check
                chai.expect(reply).to.have.string("Could not add project");
                done();
            }
        );
    });

    // test addProjectName
    it("Check for addProjectName w/ normal response.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.setHttpResponseMock(() => {
            return '{"name":"My Project", "url":"http://my.project", "description":"Hello!"}';
        });

        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "add pivotal project #12345678",
            function (reply) {
                // check
                try {
                   chai.expect(reply).to.have.string("OK!");
                   let storedData = dummyRobot.brain.get(BRAIN_KEY_PROJECTS);
                   chai.expect(storedData[12345678]).to.be.not.empty;
                   chai.expect(storedData[12345678]['name']).to.equal('My Project');
                   chai.expect(storedData[12345678]['url']).to.endWith('12345678');
                   chai.expect(storedData[12345678]['description']).to.equal('Hello!');
                } catch (err) {
                    done(err);
                    return;
                }

                done();
            });
    });

    // test addProjectName
    it("Check for addProjectName w/ error response.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.setHttpErrorMock(() => {
            return new Error('dummy errro.');
        });

        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "add pivotal project #12345678",
            function (reply) {
                // check
                chai.expect(reply).to.have.string("Could not add project");
                done();
            });
    });
});
