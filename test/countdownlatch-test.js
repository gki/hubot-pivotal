"use strict";

var chai         = require('chai');

var CountdownLatch = require('../src/scripts/countdownlatch')

describe("Test for countdownlatch.js", function() {
    it("Check constructor", function() {
        let latch = new CountdownLatch(3);
        chai.expect(latch.isCanceled()).to.be.false;
        chai.expect(latch.isTimedOut()).to.be.false;
        chai.expect(latch.getCount()).to.equal(3);
    });

    it("Check cancel", function() {
        let latch = new CountdownLatch(3);
        chai.expect(latch.isCanceled()).to.be.false;
        latch.cancel()
        chai.expect(latch.isCanceled()).to.be.true;
    });

    it("Check countDown", function() {
        let latch = new CountdownLatch(3);
        chai.expect(latch.getCount()).to.equal(3);
        latch.countDown()
        chai.expect(latch.getCount()).to.equal(2);
        latch.countDown()
        chai.expect(latch.getCount()).to.equal(1);
        latch.countDown()
        chai.expect(latch.getCount()).to.equal(0);
        latch.countDown()
        chai.expect(latch.getCount()).to.equal(0);

        chai.expect(latch.isCanceled()).to.be.false;
        chai.expect(latch.isTimedOut()).to.be.false;

    });

    it("Check countDown after cancel", function() {
        let latch = new CountdownLatch(3);
        chai.expect(latch.getCount()).to.equal(3);
        latch.countDown()
        chai.expect(latch.getCount()).to.equal(2);
        latch.cancel()
        latch.countDown()
        chai.expect(latch.getCount()).to.equal(2);

        chai.expect(latch.isCanceled()).to.be.true;
        chai.expect(latch.isTimedOut()).to.be.false;

    });
});
