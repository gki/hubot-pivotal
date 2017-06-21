"use strict";

var HttpClient     = require('scoped-http-client');


class DummyRobot {

    constructor(props) {
        this.mockResponseCallback = null;
        this.capturedCallback = null;
        this.globalHttpOptions = {};
        this.httpMockResponses = [];
        this.httpMockErrors = [];
        this.brainData = {_private: {}}
        this.userName = "taro"

        this.respond = (regix, callback) => {
            if (regix.test(this.inputMessage)) {
                let msg = {
                    match: regix.exec(this.inputMessage),
                    text: this.inputMessage,
                    send: this.captureSend,
                    emit: this.captureEmit,
                    message : {
                        user : {
                            name: this.userName
                        }
                    }
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
        };

        this.http = (url, options) => {
            let client = HttpClient.create(url).header('User-Agent', "Hubot/" + this.version);
            if (this.httpMockResponses.length > 0 || this.httpMockErrors.length > 0) {
                // console.log(`Mocked get() and post().`)
                client.get = this._responseMock;
                client.post = this._responseMock;
            }
            return client;
        };

        this.addHttpMockResponse = (callbackMock) => {
            this.httpMockResponses.push(callbackMock);
        }

        this.addHttpMockError = (callbackMock) => {
            this.httpMockErrors.push(callbackMock);
        }

        this._responseMock = () => {
            return (function(_this) {
                return function(callback) {
                    let body = _this.httpMockResponses.length > 0 ? _this.httpMockResponses.shift()() : null;
                    let err = _this.httpMockErrors.length > 0 ? _this.httpMockErrors.shift()() : null;
                    callback(err, null, body);
                    return _this;
                };
            })(this);
        };

        this.brain = {
            get   : (key) => {
                return this.brainData[key] ? this.brainData[key] : null;
            },
            set   : (key, value) => {
                this.brainData[key] = value
            },
            save  : () => {
                // do nothing console.log('called seve.')
            },
            remove: (key) => {
                delete this.brainData[key];
            },
        }
    }
}

module.exports = DummyRobot;