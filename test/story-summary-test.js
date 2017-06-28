"use strict";

var TestUtil     = require('./test-util');
var TestConst    = require('./test-const');
var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-string'));

var DummyRobot   = require('./dummy-robot');
var targetScript = require("../src/scripts/hubot-pivotal");

describe("Test for story summary feature", function() {

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

    it("show story summary w/ normal response.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");
        let testResponse = {
            kind: 'story',
            id: 12345678,
            created_at: '2017-02-15T05:36:01Z',
            updated_at: '2017-05-30T11:15:56Z',
            estimate: 1,
            story_type: 'bug',
            name: 'This is a test ticket',
            description: 'Description for test ticket.',
            current_state: 'planned',
            requested_by_id: 2222222,
            url: 'https://www.pivotaltracker.com/story/show/12345678',
            project_id: 1111,
            owner_ids: [],
            labels: []
        }

        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

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
        let reply = dummyRobot.testRun(
            targetScript,
            "let me check pv#12345678, please.",
            function (reply) {
                // check
                try {
                    chai.expect(reply).to.have.string("This is a test ticket");
                    chai.expect(reply).to.have.string("#12345678");
                    chai.expect(reply).to.have.string("https://www.pivotaltracker.com");
                    chai.expect(reply).to.have.string("Type:bug");
                    chai.expect(reply).to.have.string("Status:planned");
                    chai.expect(reply).to.have.string("Point:1");
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

    it("show story summary w/ no project info.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");
        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "let me check pv#12345678, please."
        );
        // check
        chai.expect(spyRespond.called).to.be.ng;
    });

    it("show story summary w/ error response.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockResponse(() => {
            return '{"code": "unfound_resource"}';
        });

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
        let reply = dummyRobot.testRun(
            targetScript,
            "let me check pv#12345678, please.");
        // check
        chai.expect(spyRespond.called).to.be.ng;
    });

});