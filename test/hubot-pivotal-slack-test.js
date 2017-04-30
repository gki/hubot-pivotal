// "use strict";

var chai      = require('chai'),
    // should    = chai.should(),
    // sinon     = require('sinon'),
    // sinonChai = require('sinon-chai'),
    DummyRobot = require('./DummyRobot');

// import DummyRobot from './DummyRobot';

// chai.use(sinonChai);
var hubot = require("../src/hubot-pivotal-slack.js");

describe("Sample", function() {
    // test 
    it("check respons for hello", function() {
        // this.robot.on("hoge");
        var dummyRobot = new DummyRobot();
        dummyRobot.testRun(hubot, "hello");
        console.log("output="+ dummyRobot.latestOutput)
        chai.expect(dummyRobot.latestOutput).to.equal("world!");
    });
});
