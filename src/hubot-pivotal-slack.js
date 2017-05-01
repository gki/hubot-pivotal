module.exports = function (robot) {
    robot.respond(/hello/i, messageHandling("hello"));

    function messageHandling(route) {
        if (route == "hello") {
            return function(msg) {
                    msg.send("world!");
                    return;
            }
        }
    }
};