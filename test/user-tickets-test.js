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
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");
        let testResponse = dummyUserTicketsJson;
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        _setupDummyUserToBbrain(dummyRobot);
        _setupDummyProjectToBbrain(dummyRobot);

        // test
        var actualCheckCount = 0;
        dummyRobot.testRun(targetScript,
            "show my pivotal tickets",
            function (reply) {
                // check
                actualCheckCount++;
                try {
                    switch (actualCheckCount) {
                        case 1:
                            chai.expect(reply).to.have.string(`${testResponse.stories.total_hits} tickets`);
                            break;
                        case 2: {
                            let story = testResponse.stories.stories[0];
                            chai.expect(reply).to.have.string(story.name);
                            chai.expect(reply).to.have.string(story.id);
                            chai.expect(reply).to.have.string(story.url);
                            chai.expect(reply).to.have.string(story.story_type);
                            chai.expect(reply).to.have.string(story.current_state);
                            chai.expect(reply).to.have.string(story.estimate);
                            break;
                        }
                        case 3: {
                            let story = testResponse.stories.stories[1];
                            chai.expect(reply).to.have.string(story.name);
                            chai.expect(reply).to.have.string(story.id);
                            chai.expect(reply).to.have.string(story.url);
                            chai.expect(reply).to.have.string(story.story_type);
                            chai.expect(reply).to.have.string(story.current_state);
                            chai.expect(reply).to.have.string(story.estimate);
                            done()
                            break;
                        }
                        default:
                            done(new Error("too much check than expected."))    
                    }
                } catch (err) {
                    done(err);
                    return;
                }
            });
    });

    it ("show user's all tickets (there is no user's ticket)", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify({
                "stories":{
                    "stories":[],
                    "total_hits":0,
                    "total_hits_with_done":2,
                    "total_points":0,
                    "total_points_completed":0
                },
                "query":"owner:111 "});
        });

        _setupDummyUserToBbrain(dummyRobot);
        _setupDummyProjectToBbrain(dummyRobot);

        // test
        dummyRobot.testRun(targetScript,
            "show my pivotal tickets");
        chai.expect(spyRespond).to.not.be.called;

    });
    
    it ("show user's all tickets w/ http error response.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockError(() => {
            return new Error('dummy errro.');
        });

        _setupDummyUserToBbrain(dummyRobot);
        _setupDummyProjectToBbrain(dummyRobot);

        // test
        dummyRobot.testRun(targetScript,
            "show my pivotal tickets");
        chai.expect(spyRespond).to.not.be.called;

    });

    it ("show user's all tickets w/ pivotal api error.", function() {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify({code :'unfound_resource'});
        });

        _setupDummyUserToBbrain(dummyRobot);
        _setupDummyProjectToBbrain(dummyRobot);

        // test
        dummyRobot.testRun(targetScript,
            "show my pivotal tickets");
        chai.expect(spyRespond).to.not.be.called;

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

        _setupDummyUserToBbrain(dummyRobot);
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
});

function _setupDummyUserToBbrain(dummyRobot) {
    let registeredData = {};
    registeredData[dummyRobot.userName] = {
        pv_id   : "111",
        pv_name : "Ieyasu Tokugawa"
    };
    dummyRobot.brain.set(TestConst.BRAIN_KEY_USERS, registeredData);
    return registeredData;
}

function _setupDummyProjectToBbrain(dummyRobot) {
    let testData = {
        1111 : {
            id  : 1111,
            name: 'project A',
            url: 'http//test/a',
            description: 'description for A'
        }
    };
    dummyRobot.brain.set(TestConst.BRAIN_KEY_PROJECTS, testData);
    return testData;
}

const dummyUserTicketsJson = {
  "stories":{
    "stories":[
      {
        "kind":"story",
        "id":2222,
        "created_at":"2017-06-23T09:58:12Z",
        "updated_at":"2017-06-28T05:55:07Z",
        "accepted_at":"2017-06-28T05:55:06Z",
        "story_type":"chore",
        "name":"update test environment",
        "current_state":"accepted",
        "requested_by_id":111,
        "url":"https://www.pivotaltracker.com/story/show/2222",
        "project_id":1111,
        "owner_ids":[
          111
        ],
        "labels":[

        ],
        "owned_by_id":111
      },
      {
        "kind":"story",
        "id":3333,
        "created_at":"2017-02-24T03:34:39Z",
        "updated_at":"2017-06-29T03:26:54Z",
        "estimate":0,
        "story_type":"bug",
        "name":"App crashed when user saved Foo.",
        "current_state":"unscheduled",
        "requested_by_id":111,
        "url":"https://www.pivotaltracker.com/story/show/333",
        "project_id":1111,
        "owner_ids":[
          111
        ],
        "labels":[

        ],
        "owned_by_id":111
      }
    ],
    "total_points":0,
    "total_points_completed":0,
    "total_hits":2,
    "total_hits_with_done":10
  },
  "query":"owner:111 "
};