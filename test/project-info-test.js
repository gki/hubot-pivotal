"use strict";

var TestUtil     = require('./test-util');
var TestConst    = require('./test-const');
var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));

var DummyRobot   = require('./dummy-robot');
var targetScript = require("../src/scripts/hubot-pivotal");

describe("Test for project info control feature", function() {

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
    it("show projects w/ multiple project ids.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        // process.env.PROJECT_IDS = "1111,2222,3333";
        let testData = {
            1111 : {
                id: 1111,
                name: 'project A',
                url: 'http//test/a',
                description: 'description for A'
            },
            2222 : {
                id: 2222,
                name: 'project B',
                url: 'http//test/b',
                description: 'description for B'
            },
            3333 : {
                id: 3333,
                name: 'project C',
                url: 'http//test/c',
                description: 'description for C'
            }
        }

        dummyRobot.brain.set(TestConst.BRAIN_KEY_PROJECTS, testData);
        // test
        let reply = dummyRobot.testRun(targetScript, "show pivotal projects");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        let lines = reply.split('\n');
        // empty line will be added at last.
        chai.expect(lines).to.have.length(Object.keys(testData).length * 3 + 1);
    });

    // test 
    it("show projects w/ sigle project id.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testData = {
            1111 : {
                id  : 1111,
                name: 'project A',
                url: 'http//test/a',
                description: 'description for A'
            }
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_PROJECTS, testData);

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
    it("show projects w/ no project ids.", function() {
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
    it("add project w/ unknown project id.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockResponse(() => {
            // no "name" in response Json.
            return '{"foo":"bar"}';
        });

        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "add pivotal project #12345678",
            function (reply) {
                // check
                try {
                    chai.expect(reply).to.have.string("Could not add project");
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            }
        );
    });

    // test addProjectName
    it("add project w/ normal response.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockResponse(() => {
            return '{"name":"My Project", "description":"Hello!"}';
        });

        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "add pivotal project #12345678",
            function (reply) {
                // check
                try {
                   chai.expect(reply).to.have.string("OK!");
                   let storedData = dummyRobot.brain.get(TestConst.BRAIN_KEY_PROJECTS);
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
    it("add project w/ error response.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockError(() => {
            return new Error('dummy errro.');
        });

        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "add pivotal project #12345678",
            function (reply) {
                // check
                try {
                    chai.expect(reply).to.have.string("Could not add project");
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("remove project normally.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testData = {
            1111 : {
                id  : 1111,
                name: 'project A',
                url: 'http//test/a',
                description: 'description for A'
            }
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_PROJECTS, testData);

        // test
        let reply = dummyRobot.testRun(targetScript, "remove pivotal project #1111");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.have.string("Done");
        chai.expect(dummyRobot.brain.get(TestConst.BRAIN_KEY_PROJECTS)).to.be.null;
    });

    it("remove project w/ wrong project id.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testData = {
            1111 : {
                id  : 1111,
                name: 'project A',
                url: 'http//test/a',
                description: 'description for A'
            }
        };
        dummyRobot.brain.set(TestConst.BRAIN_KEY_PROJECTS, testData);

        // test
        let reply = dummyRobot.testRun(targetScript, "remove pivotal project #2222");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.have.string("not registered");
        let remainingData = dummyRobot.brain.get(TestConst.BRAIN_KEY_PROJECTS);
        chai.expect(remainingData).to.be.not.null;
        chai.expect(remainingData["1111"]).to.be.not.null;
    });

    it("remove project w/ empty brain.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        // test
        let reply = dummyRobot.testRun(targetScript, "remove pivotal project #1111");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.have.string("no project info");
        chai.expect(dummyRobot.brain.get(TestConst.BRAIN_KEY_PROJECTS)).to.be.null;
    });
});