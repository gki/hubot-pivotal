"use strict";

var HttpClient     = require('scoped-http-client');


class DummyRobot {

    constructor(props) {
        this.mockResponseCallback = null;
        this.capturedCallback = null;
        this.globalHttpOptions = {};
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
            if (this.capturedCallback) {
                this.capturedCallback(this._output);
            }
        };

        this.captureEmit = (message) => {
            captureSend(message);
        };

        this.testRun = (extendedScript, inputMessage, callback) => {
            this.inputMessage = inputMessage;
            this.capturedCallback = callback;
            extendedScript(this);
            return this._output;
        };

        this.enableMockResponse = (callback) => {
            this.mockResponseCallback = callback;
        }

        this.http = (url, options) => {
            return HttpClient.create(url).header('User-Agent', "Hubot/" + this.version);
        }
    }
}

module.exports = DummyRobot;