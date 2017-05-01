var chai         = require('chai');
var sinon        = require('sinon');
chai.use(require('sinon-chai'));

var DummyRobot   = require('./dummy-robot');
var targetScript = require("../src/hubot-pivotal-slack");

describe("Test for hubot-pivotal-slack.js", function() {
    // test 
    it("Check response for 'hello'", function() {
        var dummyRobot = new DummyRobot();
        var spyRespond = sinon.spy(dummyRobot, "captureSend");

        // test
        var reply = dummyRobot.testRun(targetScript, "hello");

        // check
        // chai.expect(dummyRobot.respond).to.have.been.called();
        chai.expect(spyRespond.called).to.be.ok;
        chai.expect(reply).to.equal("world!");
    });

    // test 
    it("Check response for 'Nice to meet you'", function() {
        var dummyRobot = new DummyRobot();
        var spyRespond = sinon.spy(dummyRobot, "captureSend");

        // test
        var reply = dummyRobot.testRun(targetScript, "Nice to meet you");

        // check
        chai.expect(spyRespond.called).to.not.be.ok;
        chai.expect(reply).to.be.undefined;
    });

});
