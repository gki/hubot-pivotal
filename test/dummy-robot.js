"use strict";

var HttpClient     = require('scoped-http-client');


class DummyRobot {

    constructor(props) {
        this.mockResponseCallback = null;
        this.capturedCallback = null;
        this.globalHttpOptions = {};
        this.httpResponseMock = null;
        this.httpErrorMock = null;
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
            if (this.httpResponseMock || this.httpErrorMock) {
                // console.log(`Mocked get() and post().`)
                client.get = this._responseMock;
                client.post = this._responseMock;
            }
            return client;
        };

        this.setHttpResponseMock = (callbackMock) => {
            this.httpResponseMock = callbackMock;
        }

        this.setHttpErrorMock = (callbackMock) => {
            this.httpErrorMock = callbackMock;
        }

        this._responseMock = () => {
            return (function(_this) {
                return function(callback) {
                    let body = _this.httpResponseMock ? _this.httpResponseMock() : null;
                    let err = _this.httpErrorMock ? _this.httpErrorMock() : null;
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