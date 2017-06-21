"use strict";

var pad = require('pad');

module.exports = function (robot) {
    var RESPONSE_TO_ERROR = 'An error occurred. %{message}';
    var PIVOTAL_API_BASE_URL = 'https://www.pivotaltracker.com/services/v5/'
    var PIVOTAL_API_PROJECTS = 'projects/'
    var PIVOTAL_API_ACCOUNTS = 'accounts/'
    var PIVOTAL_WEB_BASE_URL = 'https://www.pivotaltracker.com/n/projects/'
    var PIVOTAL_API_FEILDS = '&fields=name,url,name,story_type,estimate,created_at,current_state,owner_ids'

    var BRAIN_KEY_PROJECTS = 'projects_info';
    var BRAIN_KEY_USERS    = 'users_info';
    var BRAIN_KEY_ACCOUNT  = 'account_info';

    robot.hear(/^.*?\b(?:pivotal|pv)#(\d+)\b.*$/i, messageHandling('story'));

    robot.respond(/show pivotal projects/i, messageHandling('show_projects'));
    
    robot.respond(/add pivotal project #(\d+).*$/i, messageHandling('add_project'));

    robot.respond(/remove pivotal project #(\d+).*$/i, messageHandling('remove_project'));

    robot.respond(/link me with pivotal user (.*)$/i, messageHandling('link_user'));

    robot.respond(/unlink me from pivotal user/i, messageHandling('unlink_user'));

    function messageHandling(route) {
        return function(msg) {
            // console.log("route=" + route);
            try {
                if (route === 'show_projects') {
                    replyProjectsInfo(msg);
                } else if (route === 'story') {
                    replyStorySummary(msg, msg.match[1]);
                } else if (route === 'add_project') {
                    addProject(msg, msg.match[1]);
                } else if (route === 'remove_project') {
                    removeProject(msg, msg.match[1]);
                } else if (route === 'link_user') {
                    linkUser(msg, msg.match[1])
                } else if (route === 'unlink_user') {
                    unlinkUser(msg);
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

    function addProject(msg, projectId) {
        let name = "Unknown";
        _createProjectApiClient(projectId)
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
            robot.brain.save();
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
        _removeAndSaveToBrain(projectsInfo, projectId, BRAIN_KEY_PROJECTS);
        msg.send(`Done. Project ${name} (#${projectId}) has been deleted from my brain.`);
    }

    function linkUser(msg, pivotalUserInfo) {
        let accountInfo = robot.brain.get(BRAIN_KEY_ACCOUNT);
        if (!accountInfo) {
            _setupAccountInfo(msg, function () {
                // call self again after it completes account info setup.
                linkUser(msg, pivotalUserInfo);
            });
            return;
        }

        let chatUSerId = msg.message.user.name;
        let usersInfo = robot.brain.get(BRAIN_KEY_USERS);
        if (usersInfo && usersInfo[chatUSerId]) {
            // return error if already this user is linked.
            msg.send(`You've already linked as ${usersInfo[chatUSerId].pv_name}. If want to change link, do unlink at first.`)
            return;
        }


        _createAccountApiClient(`/${accountInfo["id"]}/memberships`)
        .get()(function(err, resp, body) {
            if (err) {
                msg.send(`An error occurred during get pivotal member info. Check network or Pivotal Tracker status.`);
                return;
            }

            let jsonRes = JSON.parse(body);
            if (_isPivotalApiError(jsonRes)) {
                console.log("Could not get member info for pivotal account. Check members are there in Pivotal Tracker.");
                return;
            }

            for (let index in jsonRes) {
                let person = jsonRes[index].person;
                if (person.name === pivotalUserInfo || person.initials === pivotalUserInfo || person.username === pivotalUserInfo) {
                    _addUserInfo(msg, person);
                    msg.send(`Done. Linked you as a pivotal user: ${person.name} (id:${person.id})`);
                    return;
                }
            }

            msg.send("Could not find any member who has information `" + pivotalUserInfo + "`.");
        });
    }

    function _addUserInfo(msg, person) {
        let usersInfo = robot.brain.get(BRAIN_KEY_USERS);
        usersInfo = usersInfo ? usersInfo : {};
        usersInfo[msg.message.user.name] = {
            pv_id   : person.id,
            pv_name : person.name
        };
        robot.brain.set(BRAIN_KEY_USERS, usersInfo);
        robot.brain.save();
    }

    function unlinkUser(msg) {
        let usersInfo = robot.brain.get(BRAIN_KEY_USERS);
        if (!usersInfo || !usersInfo[msg.message.user.name]) {
            msg.send("There is no liked pivotal user in my brain. You seem to already unlinked.");
            return;
        }

        _removeAndSaveToBrain(usersInfo, msg.message.user.name, BRAIN_KEY_USERS)
        msg.send("Done. I've removed your linked pivotal user from my brain.");
    }

    function _removeAndSaveToBrain(target, key, brainKey) {
        delete target[key];
        if (Object.keys(target).length > 0) {
            robot.brain.set(brainKey, target);
        } else {
            // removed all info.
            robot.brain.remove(brainKey);
        }
        robot.brain.save();
    }

    function _setupAccountInfo(msg, completionCallback) {
        _createAccountApiClient()
        .get()(function(err, resp, body) {
            if (err) {
                msg.send(`An error occurred during setting up account info. Check network or Pivotal Tracker status.`);
                return;
            }
            
            let jsonRes = JSON.parse(body);
            if (_isPivotalApiError(jsonRes)) {
                console.log("Could not get account info for your pivotal token. Check environment parameter HUBOT_PIVOTAL_TOKEN.");
                console.log(jsonRes);
                return;
            }

            let accountInfo = {
                id: jsonRes[0].id
            };

            robot.brain.set(BRAIN_KEY_ACCOUNT, accountInfo);
            robot.brain.save()
            console.log("Finished to setup account info.");
            completionCallback();
        });
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
        _createProjectApiClient(projectInfo["id"]
            + "/stories"
            + "/" + storyId)
        .get()(function(err, resp, body) {
            if (err) {
                // no need to reply
                console.log(`Could not get ticket info for story id ${storyId} of project id ${projectInfo["id"]} due to err response.`)
                return;
            }
            
            let jsonRes = JSON.parse(body);
            if (_isPivotalApiError(jsonRes)) {
                // no need to reply
                console.log("Could not find any ticket for #" + storyId + " in " + projectInfo["name"]);
                return;
            }

            let response = `#${jsonRes['id']} ${jsonRes['name']}\n` +
                           `${jsonRes['url']} at ${projectInfo["name"]}\n` +
                           `Type:${jsonRes['story_type']} Status:${jsonRes['current_state']} Point:${jsonRes['estimate']}`;
            msg.send(response);
        });
    }

    function _createProjectApiClient(pathAfterBaseUrl) {
        return _createApiClient(PIVOTAL_API_PROJECTS, pathAfterBaseUrl);
    }

    function _createAccountApiClient(pathAfterBaseUrl) {
        return _createApiClient(PIVOTAL_API_ACCOUNTS, pathAfterBaseUrl);
    }

    function _createApiClient(api, pathAfterBaseUrl) {
        if (pathAfterBaseUrl == null) {
            pathAfterBaseUrl = "";
        }
        return robot.http(PIVOTAL_API_BASE_URL + api + pathAfterBaseUrl)
            .header('X-TrackerToken', process.env.HUBOT_PIVOTAL_TOKEN)
            .timeout(3000);
    }

    function _isPivotalApiError(jsonRes) {
        return jsonRes['code'] === "unfound_resource" || jsonRes['code'] == "route_not_found";
    }

    function error(e, msg) {
        let response = RESPONSE_TO_ERROR.replace(/%\{message\}/, e.message);
        msg.send(response);
    }
};