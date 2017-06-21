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
    let BRAIN_KEY_USERS    = 'users_info';
    let BRAIN_KEY_ACCOUNT  = 'account_info';

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
            project_id: 3333333,
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
        dummyRobot.brain.set(BRAIN_KEY_PROJECTS, testData);

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
        dummyRobot.brain.set(BRAIN_KEY_PROJECTS, testData);

        // test
        let reply = dummyRobot.testRun(
            targetScript,
            "let me check pv#12345678, please.");
        // check
        chai.expect(spyRespond.called).to.be.ng;
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
        dummyRobot.brain.set(BRAIN_KEY_PROJECTS, testData);

        // test
        let reply = dummyRobot.testRun(targetScript, "remove pivotal project #1111");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.have.string("Done");
        chai.expect(dummyRobot.brain.get(BRAIN_KEY_PROJECTS)).to.be.null;
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
        dummyRobot.brain.set(BRAIN_KEY_PROJECTS, testData);

        // test
        let reply = dummyRobot.testRun(targetScript, "remove pivotal project #2222");

        // check
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.have.string("not registered");
        let remainingData = dummyRobot.brain.get(BRAIN_KEY_PROJECTS);
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
        chai.expect(dummyRobot.brain.get(BRAIN_KEY_PROJECTS)).to.be.null;
    });

    it("link pivotal user by name.", function(done) {
        let dummyRobot = new DummyRobot();
        let spyRespond = sinon.spy(dummyRobot, "captureSend");

        let testResponse = _createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(BRAIN_KEY_ACCOUNT, testData);

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
                    let storedUsersInfo = dummyRobot.brain.get(BRAIN_KEY_USERS);
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

        let testResponse = _createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(BRAIN_KEY_ACCOUNT, testData);

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
                    let storedUsersInfo = dummyRobot.brain.get(BRAIN_KEY_USERS);
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

        let testResponse = _createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(BRAIN_KEY_ACCOUNT, testData);

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
                    let storedUsersInfo = dummyRobot.brain.get(BRAIN_KEY_USERS);
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

        let testResponse = _createTestResponseForLinkUser();
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
        dummyRobot.brain.set(BRAIN_KEY_ACCOUNT, testData);

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
                    let storedUsersInfo = dummyRobot.brain.get(BRAIN_KEY_USERS);
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

        let testResponse = _createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(BRAIN_KEY_ACCOUNT, testData);
        let registeredData = {};
        registeredData[dummyRobot.userName] = {
            pv_id   : "999",
            pv_name : "Masamune Date"
        };
        dummyRobot.brain.set(BRAIN_KEY_USERS, registeredData);

        // test
        dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.not.have.string("Done");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(BRAIN_KEY_USERS);
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

        let testResponse = _createTestResponseForLinkUser();
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        let testData = {
            id : "1234567"
        };
        dummyRobot.brain.set(BRAIN_KEY_ACCOUNT, testData);

        // test
        let reply = dummyRobot.testRun(targetScript,
            "link me with pivotal user Matthew Calbraith Perry",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("Could not find");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(BRAIN_KEY_USERS);
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
        dummyRobot.brain.set(BRAIN_KEY_ACCOUNT, testData);

        // test
        let reply = dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.have.string("An error occurred during get pivotal member info");

                    // brain
                    let storedUsersInfo = dummyRobot.brain.get(BRAIN_KEY_USERS);
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

        let testResponse = {id: 7777777};
        // for 1st response
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(testResponse);
        });

        // for 2nd response
        dummyRobot.addHttpMockResponse(() => {
            return JSON.stringify(_createTestResponseForLinkUser());
        });

        // test
        dummyRobot.testRun(targetScript,
            "link me with pivotal user Ieyasu Tokugawa",
            function (reply) {
                // check
                try {
                    // response
                    chai.expect(reply).to.not.have.string("Done");
                    // brain
                    let storedAccountInfo = dummyRobot.brain.get(BRAIN_KEY_ACCOUNT);
                    chai.expect(storedAccountInfo).to.be.not.null;
                    chai.expect(storedAccountInfo.id).to.equal(testResponse.id)
                } catch (err) {
                    done(err);
                    return;
                }
                done();
            });
    });

});

function _createTestResponseForLinkUser() {
    return [
        {
            "id": 111, 
            "kind": "account_membership", 
            "person": {
                "email": "yasu@tenka.com", 
                "id": 111, 
                "initials": "IT", 
                "kind": "person", 
                "name": "Ieyasu Tokugawa", 
                "username": "tanuki"
            }
        }, 
        {
            "id": 222, 
            "kind": "account_membership", 
            "person": {
                "email": "hide@tenka.com", 
                "id": 222, 
                "initials": "HT", 
                "kind": "person", 
                "name": "Hideyoshi Toyotomi", 
                "username": "saru"
            }
        }, 
        {
            "id": 333, 
            "kind": "account_membership", 
            "person": {
                "email": "nobu@tenks.com", 
                "id": 333, 
                "initials": "NO", 
                "kind": "person", 
                "name": "Nobunaga Oda", 
                "username": "utsuke"
            }
        }
    ];
}