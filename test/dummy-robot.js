"use strict";

class DummyRobot {

    constructor(props) {
        this.respond = (regix, callback) => {
            if (regix.test(this.inputMessage)) {
                let msg = {
                    match: regix.exec(this.inputMessage),
                    text: this.inputMessage,
                    send: this.captureSend,
                    emit: this.captureEmit,
                }
                callback(msg);
            }
        };

        this.hear = (regix, callback) => {
            this.respond(regix, callback);
        };

        this.captureSend = (message) => {
            this._output = message;
        };

        this.captureEmit = (message) => {
            captureSend(message);
        };

        this.testRun = (extendedScript, inputMessage) => {
            this.inputMessage = inputMessage;
            extendedScript(this);
            return this._output;
        };
    }
}

module.exports = DummyRobot;