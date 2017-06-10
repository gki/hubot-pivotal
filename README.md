[![npm version](https://badge.fury.io/js/hubot-pivotal.svg)](https://badge.fury.io/js/hubot-pivotal)

[![Build Status](https://travis-ci.org/gki/hubot-pivotal.svg?branch=master)](https://travis-ci.org/gki/hubot-pivotal)
[![Dependency Status](https://gemnasium.com/badges/github.com/gki/hubot-pivotal.svg)](https://gemnasium.com/github.com/gki/hubot-pivotal)
[![Code Climate](https://codeclimate.com/github/gki/hubot-pivotal/badges/gpa.svg)](https://codeclimate.com/github/gki/hubot-pivotal)
[![Test Coverage](https://codeclimate.com/github/gki/hubot-pivotal/badges/coverage.svg)](https://codeclimate.com/github/gki/hubot-pivotal/coverage)

# hubot-pivotal
hubot plugin for pivotal tracker

## Installation
In your hubot project, run
```
$ npm install --save hubot-pivotal
```
Then, add `hubot-pivotal` to your `external-scripts.json`:
```
[
  ...,
  "hubot-pivotal"
]
```

#### Note: Please use permanent hubot brain.

This plugin stores data to brain. So, use a permanent solution for the hubot brain like Redis, Mongo etc...

## Configuration
Environmental variables
```
HUBOT_PIVOTAL_TOKEN    : Access token for your pivotal projects.
                         If you want to allow your hubot to access multiple projects,
                         make sure this token has proper permission.
```

## Sample
```
> @hubot add pivotal project #1111111
OK! I've added new project "Foo Project" for #1111111

> @hubot add pivotal project #2222222
OK! I've added new project "Bar Project" for #2222222

> @hubot show pivotal projects
Here you are!
Foo Project      https://www.pivotaltracker.com/n/projects/1111111
This is Foo project as you know.

Bar Project         https://www.pivotaltracker.com/n/projects/2222222
No description for this project.

> Hey @taro, did you finished pv#123456789?
#123456789 Add awesome feature for our web application.
https://www.pivotaltracker.com/story/show/123456789 at Foo Project
Type:bug Status:delivered Point:0
```
