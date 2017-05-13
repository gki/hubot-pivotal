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

    robot.respond(/show pivotal projects/i, messageHandling('projects'));
    
    robot.respond(/show pivotal project name for #(\d+).*$/i, messageHandling('project_name'));

    robot.respond(/hello/i, messageHandling("hello"));

    function messageHandling(route) {
        return function(msg) {
            console.log("route=" + route);
            try {
                if (route == "hello") {
                    msg.send("world!");
                    return;
                }

                if (!PROJECT_IDS || PROJECT_IDS.length == 0) {
                    msg.send("No project ids are registered. :(");
                    return;
                }

                if (route == 'projects') {
                    msg.send(getPivotalUrls());
                } else if (route == 'story') {
                    for (index in PROJECT_IDS) {
                        replyStorySummary(msg, PROJECT_IDS[index], msg.match[1]);
                    }
                } else if (route == 'project_name') {
                    replyProjectName(msg, msg.match[1]);
                }
            } catch (e) {
                error(e, msg);
            }
        };
    };

    function getPivotalUrls() {
        let response = "";
        for (let index in PROJECT_IDS) {
            response += " " + PIVOTAL_WEB_BASE_URL + PROJECT_IDS[index] + "\n";
        };
        return response;
    };

    function replyProjectName(msg, projectId) {
        let name = "Unknown"
        robot.http(PIVOTAL_API_BASE_URL + projectId)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .timeout(3000)
        .get()(function(err, resp, body) {
            if (err) {
                console.log(err);
                msg.send(`Could not get project name for id ${projectId} due to err response.`)
                return;
            }
            var jsonRes = JSON.parse(body);
            if (jsonRes['name']) {
                name = jsonRes['name'];
            }
            msg.send(name);
        });
    }

    function replyStorySummary(msg, projectId, storyId) {
        let ticketArray = [];

        robot.http(PIVOTAL_API_BASE_URL
            + projectId
            + "/stories"
            + "/" + storyId)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .timeout(3000)
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