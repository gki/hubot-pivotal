var chai       = require('chai'),
    DummyRobot = require('./DummyRobot'),
    hubot      = require("../src/hubot-pivotal-slack.js");

describe("Test for hubot-pivotal-slack.js", function() {
    // test 
    it("Check response for hello", function() {
        // this.robot.on("hoge");
        var dummyRobot = new DummyRobot();
        dummyRobot.testRun(hubot, "hello");
        chai.expect(dummyRobot.latestOutput).to.equal("world!");
    });
});
