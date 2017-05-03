"use strict";

module.exports = function (robot) {
    var RESPONSE_TO_ERROR = 'An error occurred. %{message}';
    if (process.env.PROJECT_IDS) {
        var PROJECT_IDS = process.env.PROJECT_IDS.split(',');
    }
    var PIVOTAL_API_BASE_URL = 'https://www.pivotaltracker.com/services/v5/projects/'
    var PIVOTAL_WEB_BASE_URL = 'https://www.pivotaltracker.com/n/projects/'
    var PIVOTAL_API_FEILDS = '&fields=name,url,name,story_type,estimate,created_at,current_state,owner_ids'

    robot.hear(/^.*?\b(?:pivotal|pv)#(\d+)\b.*$/i, messageHandling('story'));

    robot.respond(/^show pivotal projects$/i, messageHandling('projects'));
    
    robot.respond(/hello/i, messageHandling("hello"));

    function messageHandling(route) {
        if (route == "hello") {
            return function(msg) {
                    msg.send("world!");
                    return;
            }
            return;
        }

        if (!PROJECT_IDS || PROJECT_IDS.length == 0) {
            return function (msg) {
                msg.send("No project ids are registered. :(");
                return;
            }
            return;
        }

        if (route == 'projects') {
            return function(msg) {
                try {
                    msg.send(getPivotalUrls());
                } catch (e) {
                    error(e, msg);
                }
            }
        } else if (route == 'story') {
            return function(msg) {
                try {
                    for (index in PROJECT_IDS) {
                        replyStorySummary(msg, PROJECT_IDS[index], msg.match[1])
                    }
                } catch (e) {
                    error(e, msg);
                }
            }
        }
    };

    function getPivotalUrls() {
        let response = "";
        for (let index in PROJECT_IDS) {
            response += " " + PIVOTAL_WEB_BASE_URL + PROJECT_IDS[index] + "\n";
        };
        return response;
    };

    function replyStorySummary(msg, projectId, storyId) {
        let ticketArray = [];

        robot.http(PIVOTAL_API_BASE_URL
            + projectId
            + "/stories"
            + "/" + storyId)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .get()(function(err, resp, body) {

            let jsonRes = JSON.parse(body);
            let ticketInfo = {};

            if (jsonRes['code'] === "unfound_resource") {
                console.log("Could not fide any ticket for #" + storyId + " in " + projectName);
            } else {
                    let point = jsonRes['estimate'];
                    if (typeof point === "undefined") {
                        point = '-';
                        ticketInfo['color'] = 'warning';
                    }

                    if (/accepted/i.test(jsonRes['current_state'])) {
                        ticketInfo['color'] = 'good';
                    }
                    console.log("Response content will be : " + "#" + jsonRes['id'] + " " + jsonRes['name']);

                    ticketInfo['title'] = "#" + jsonRes['id'] + " " + jsonRes['name'];
                    ticketInfo['title_link'] = jsonRes['url'];
                    ticketInfo['text'] = "created:" + jsonRes['created_at'] + "\ttype:" + jsonRes['story_type'] + "\tpoint:" + point + "\tstatus:" + jsonRes['current_state'];
            }

            robot.emit('slack.attachment',
                {
                    "message" : msg.message,
                    "content" : ticketInfo
                });
        });
    }

    function error(e, msg) {
        let response = RESPONSE_TO_ERROR.replace(/%\{message\}/, e.message);
        msg.send(response);
    };
};