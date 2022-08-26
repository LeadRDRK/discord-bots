module.exports = (msg, args, voice, limits, cfn) => {
    if (args.length < 1) {
        msg.channel.send("Missing arguments.");
        return;
    }
    var pitch = limits.defPitch;
    var speed = limits.defSpeed;
    for (i = 0; i < 2; ++i) {
        var arg = args[0];
        var num = parseInt(arg);
        if (isNaN(num)) break;

        if (i == 0) {
            pitch = num;
        } else if (i == 1) {
            speed = num;
        }
        args.shift();
    }

    if (pitch > limits.maxPitch || pitch < limits.minPitch) {
        msg.channel.send("Pitch too " + (pitch > limits.maxPitch ? "high" : "low") + ".\n" +
                         `Min pitch: ${limits.minPitch}, max pitch: ${limits.maxPitch}`);
        return;
    }
    if (speed > limits.maxSpeed || speed < limits.minSpeed) {
        msg.channel.send("Speed too " + (speed > limits.maxSpeed ? "high" : "low") + ".\n" +
                         `Min speed: ${limits.minSpeed}, max speed: ${limits.maxSpeed}`);
        return;
    }
    var input = args.join(" ");
    if (!input.trim().length) {
        msg.channel.send("No text provided.");
        return;
    }
    var url = `https://tetyys.com/SAPI4/SAPI4?text=${input}&voice=${voice}&pitch=${pitch}&speed=${speed}`;
    msg.channel.startTyping();
    msg.channel.send({
        files: [{
            attachment: url,
            name: cfn ? `${cfn}.wav` : `Microsoft ${voice}.wav`
        }]
    }).then(() => {
        msg.channel.stopTyping(true);
    })
}