module.exports = function (robot) {
    var RESPONSE_TO_ERROR = 'An error occurred. %{message}';
    if (process.env.PROJECT_IDS) {
        var PROJECT_IDS = process.env.PROJECT_IDS.split(',');
    }
    var PIVOTAL_API_BASE_URL = 'https://www.pivotaltracker.com/services/v5/projects/'
    var PIVOTAL_WEB_BASE_URL = 'https://www.pivotaltracker.com/n/projects/'
    var PIVOTAL_API_FEILDS = '&fields=name,url,name,story_type,estimate,created_at,current_state,owner_ids'

    // robot.respond(/pivotal newtickets(?: -t ([^\s]+))?(?: (\d+)?)? *$/i, newStoriesCommand('feature,chore'));

    // robot.respond(/pivotal newbugs(?: -t ([^\s]+))?(?: (\d+)?)? *$/i, newStoriesCommand('bug'));

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

    function newStoriesCommand(command) {
        return function(msg) {
            try {
                var projectName = "All";
                if (msg.match[1]) {
                    projectName = getProjectName(msg.match[1]);
                }

                var baseDate = computeDate(new Date(), -7);
                
                if (msg.match[2]) {
                    if (msg.match[2].length != 4 && msg.match[2].length != 8) {
                        throw new Error("2nd arg 'base data' should be MMDD or YYYYMMDD");
                    }
                    var dateString = msg.match[2];
                    if (dateString.length == 4) {
                        dateString = (new Date()).getFullYear() + dateString;
                    }

                    baseDate = getDateFromDateString(dateString);
                }

                // confirmation message
                msg.send("I will show new " + command + " stories created in the week including " + convertToYYYY_MM_DD(baseDate) + " for " + projectName + ".");

                if (/All/.test(projectName)) {
                    for (index in PROJECT_IDS) {
                        replyNewStories(msg, PROJECT_IDS[index], baseDate, command) 
                    };
                } else {
                    replyNewStories(msg, projectName, baseDate, command);
                }
            } catch (e) {
                error(e, msg);
            }
        };
    };

    function getPivotalUrls() {
        var response = "";
        for (index in PROJECT_IDS) {

            response += " " + PIVOTAL_WEB_BASE_URL + PROJECT_IDS[index] + "\n";
        };
        return response;
    };

    function replyStorySummary(msg, projectId, storyId) {
        var ticketArray = [];

        robot.http(PIVOTAL_API_BASE_URL
            + projectId
            + "/stories"
            + "/" + storyId)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .get()(function(err, resp, body) {

            var jsonRes = JSON.parse(body);
            var ticketInfo = {};

            if (jsonRes['code'] === "unfound_resource") {
                console.log("Could not fide any ticket for #" + storyId + " in " + projectName);
            } else {
                    var point = jsonRes['estimate'];
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

    function replyNewStories(msg, projectId, baseDate, types) {
        var weekday = baseDate.getDay();
        var sundayYMD = convertToYYYY_MM_DD(computeDate(baseDate, - (weekday)));
        var saturdayYMD = convertToYYYY_MM_DD(computeDate(baseDate, 6 - weekday));
        var filterValue = "created:" + sundayYMD + "..." + saturdayYMD + " type:" + types + " includedone:true";

        var ticketArray = [];
        robot.http(PIVOTAL_API_BASE_URL
            + projectId
            + "/stories?"
            + "&filter=" + filterValue
            + PIVOTAL_API_FEILDS)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .get()(function(err, resp, body) {
            var response = "";
            var jsonRes = JSON.parse(body);
            var unestimatedCount = 0;
            var estimatedTotal = 0;
            if (jsonRes.length > 0) {
                jsonRes.sort(function(a,b) {
                    if(a['created_at'] < b['created_at']) return -1;
                    if(a['created_at'] > b['created_at']) return 1;
                    return 0;
                });

                jsonRes.forEach(function(val,index,ar){
                    var ticketInfo = {};
                    var point = val['estimate'];
                    if (typeof point === "undefined") {
                        point = '-';
                        unestimatedCount++;
                        ticketInfo['color'] = 'warning';
                    } else {
                        estimatedTotal = estimatedTotal + point;
                    }

                    if (/accepted/i.test(val['current_state'])) {
                        ticketInfo['color'] = 'good';
                    }
                    ticketInfo['title'] = "#" + val['id'] + " " + val['name'];
                    ticketInfo['title_link'] = val['url'];
                    ticketInfo['text'] = "created:" + val['created_at'] + "\ttype:" + val['story_type'] + "\tpoint:" + point + "\tstatus:" + val['current_state'];
                    ticketArray.push(ticketInfo);
               });
            }
            var header = "Team:" + projectName + " >>> Total "+ jsonRes.length +" tickets, " + estimatedTotal + " points, Unestimated " + unestimatedCount + " tickets.\n"
                + "filter : `"+filterValue+"`";
            var formattedResponse = {
                "text": header,
                "attachments" : ticketArray
            }
            robot.emit('slack.attachment',
                {
                    "message" : msg.message,
                    "text" : header,
                    "content" : ticketArray
                });
        });
    };

    function error(e, msg) {
        var response = RESPONSE_TO_ERROR.replace(/%\{message\}/, e.message);
        msg.send(response);
    };
};