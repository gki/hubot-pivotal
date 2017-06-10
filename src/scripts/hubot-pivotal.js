"use strict";

var pad = require('pad');

module.exports = function (robot) {
    var RESPONSE_TO_ERROR = 'An error occurred. %{message}';
    var PIVOTAL_API_BASE_URL = 'https://www.pivotaltracker.com/services/v5/projects/'
    var PIVOTAL_WEB_BASE_URL = 'https://www.pivotaltracker.com/n/projects/'
    var PIVOTAL_API_FEILDS = '&fields=name,url,name,story_type,estimate,created_at,current_state,owner_ids'

    var BRAIN_KEY_PROJECTS = 'projects_info';

    robot.hear(/^.*?\b(?:pivotal|pv)#(\d+)\b.*$/i, messageHandling('story'));

    robot.respond(/show pivotal projects/i, messageHandling('show_projects'));
    
    robot.respond(/add pivotal project #(\d+).*$/i, messageHandling('add_project'));

    robot.respond(/remove pivotal project #(\d+).*$/i, messageHandling('remove_project'));

    function messageHandling(route) {
        return function(msg) {
            // console.log("route=" + route);
            try {
                if (route === "hello") {
                    msg.send("world!");
                    return;
                }

                if (route === 'show_projects') {
                    replyProjectsInfo(msg);
                } else if (route === 'story') {
                    replyStorySummary(msg, msg.match[1]);
                } else if (route === 'project_name') {
                    replyProjectName(msg, msg.match[1]);
                } else if (route === 'add_project') {
                    addProject(msg, msg.match[1]);
                } else if (route === 'remove_project') {
                    removeProject(msg, msg.match[1]);
                }
            } catch (e) {
                error(e, msg);
            }
        };
    }

    function replyProjectsInfo(msg) {
        let projectsInfo = robot.brain.get(BRAIN_KEY_PROJECTS);
        if (!projectsInfo) {
            msg.send("Hmm? There is no project info. Tell me your project id by `add pivotal project #nnnnnnnn`. ;) ")
            return;
        }

        let response = "";
        for (let key in projectsInfo) {
            let info = projectsInfo[key];
            response += `${pad(info['name'], 15)} ${info['url']}\n${info['description']}\n\n`;
        }
        msg.send("Here you are!");
        msg.send(response);
    }

    function replyProjectName(msg, projectId) {
        let name = "Unknown"
        robot.http(PIVOTAL_API_BASE_URL + projectId)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .timeout(3000)
        .get()(function(err, resp, body) {
            if (err) {
                msg.send(`Could not get project name for id ${projectId} due to err response.`)
                return;
            }
            let jsonRes = JSON.parse(body);
            if (jsonRes['name']) {
                name = jsonRes['name'];
            }
            msg.send(name);
        });
    }

    function addProject(msg, projectId) {
        let name = "Unknown"
        robot.http(PIVOTAL_API_BASE_URL + projectId)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .timeout(3000)
        .get()(function(err, resp, body) {
            if (err) {
                msg.send(`Could not add project for id ${projectId} due to err response.`)
                return;
            }
            let jsonRes = JSON.parse(body);
            let name = jsonRes['name'];
            if (!name) {
                msg.send(`Could not add project for id ${projectId}. Check permission or project id on your pivotal project.`)
                return;
            }

            let projectsInfo = robot.brain.get(BRAIN_KEY_PROJECTS);
            projectsInfo = projectsInfo ? projectsInfo : {};

            let description = jsonRes['description'];
            description = description ? description : "No description for this project."
            let url = PIVOTAL_WEB_BASE_URL + projectId;

            let isProjectInfoExist = projectsInfo[projectId];

            projectsInfo[projectId] = {
                    id          : projectId,
                    name        : name,
                    description : description,
                    url         : url
                };

            robot.brain.set(BRAIN_KEY_PROJECTS, projectsInfo);
            if (isProjectInfoExist) {
                msg.send(`OK! I've updated project "${name}" for #${projectId} with the latest info.`);
            } else {
                msg.send(`OK! I've added new project "${name}" for #${projectId}`);
            }
        });
    }

    function removeProject(msg, projectId) {
        let projectsInfo = robot.brain.get(BRAIN_KEY_PROJECTS);
        if (!projectsInfo) {
            msg.send("Hahaha. There is no project info!")
            return;
        }

        let targetInfo = projectsInfo[projectId];
        if (!targetInfo) {
            msg.send(`Hmm? Project id ${projectId} has not registered to my brain.`)
            return;
        }

        let name = targetInfo['name'];
        delete projectsInfo[projectId];
        if (Object.keys(projectsInfo).length > 0) {
            robot.brain.set(BRAIN_KEY_PROJECTS, projectsInfo);
        } else {
            // removed all info.
            robot.brain.remove(BRAIN_KEY_PROJECTS);
        }
        robot.brain.save();
        msg.send(`Done. Project ${name} (#${projectId}) has been deleted from my brain.`);
    }

    function replyStorySummary(msg, storyId) {
        let projectsInfo = robot.brain.get(BRAIN_KEY_PROJECTS);
        if (!projectsInfo) {
            console.log("Ignore because there is no pivotal projet info in brain.")
            return;
        }

        for (let key in projectsInfo) {
            _replyStorySummary(msg, projectsInfo[key], storyId);
        }
    }

    function _replyStorySummary(msg, projectInfo, storyId) {
        robot.http(PIVOTAL_API_BASE_URL
            + projectInfo["id"]
            + "/stories"
            + "/" + storyId)
        .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
        .timeout(3000)
        .get()(function(err, resp, body) {
            let jsonRes = JSON.parse(body);
            if (jsonRes['code'] === "unfound_resource") {
                console.log("Could not fide any ticket for #" + storyId + " in " + projectInfo["name"]);
            } else {
                    let response = `#${jsonRes['id']} ${jsonRes['name']}\n` +
                                   `${jsonRes['url']} at ${projectInfo["name"]}\n` +
                                   `Type:${jsonRes['story_type']} Status:${jsonRes['current_state']} Point:${jsonRes['estimate']}`;
                    msg.send(response);
            }
        });
    }

    function error(e, msg) {
        let response = RESPONSE_TO_ERROR.replace(/%\{message\}/, e.message);
        msg.send(response);
    }
};