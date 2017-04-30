"use strict";

class DummyRobot {

    constructor(props) {
        this.captureSend = (message) => {
            this.latestOutput = message;
        };

        this.latestOutput = (output) => {
            this._output = output;
        };

        this.respond = (regix, callback) => {
            if (regix.test(this.inputMessage)) {
                var msg = {
                    match: regix.exec(this.inputMessage),
                    text: this.inputMessage,
                    send: this.captureSend,
                    emit: this.captureEmit,
                }
                callback(msg);
            }
        };

        this.latestOutput = () => {
            return this._output;
        };

        this.hear = (regix, callback) => {
            respond(regix, callback);
        };

        this.captureEmit = (message) => {
            captureSend(message);
        };

        this.testRun = (extendedScript, inputMessage) => {
            this.inputMessage = inputMessage;
            extendedScript(this);
        };
    }
}

module.exports = DummyRobot;