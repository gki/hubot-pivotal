module.exports = function (robot) {
    robot.respond(/hello/i, messageHandling("hello"));

    function messageHandling(route) {
        // console.log("called messageHandling for " + route);
        if (route == "hello") {
            return function(msg) {
                // console.log("called messageHandling anonymous function");
                    msg.send("world!");
                    // console.log("called msg.send");
                    return;
            }
        }
    }
};