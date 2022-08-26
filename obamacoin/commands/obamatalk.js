const http = require("http");

var help = {
    usage: "<text>",
    desc: "Make Obama say something for you.",
    aliases: ["obama"]
}

function execute(msg, args) {
    msg.channel.startTyping();
    let text = args.join(" ");
    let req = http.request("http://talkobamato.me/synthesize.py?input_text=" + text, {method: "POST"}, res => {
        if (res.statusCode >= 400 && res.statusCode <= 599) {
            msg.channel.send("HTTP Error " + res.statusCode);
            return;
        }
        if (!res.headers.location) {
            msg.channel.send("Unknown error. Please try again later.");
            return;
        }
        let pageUrl = new URL(res.headers.location);
        let speechKey = pageUrl.search.split("speech_key=").pop();
        let videoUrl = `http://talkobamato.me/synth/output/${speechKey}/obama.mp4`;
	    setTimeout(() => {
            msg.channel.send({files: [videoUrl]});
            msg.channel.stopTyping(true);
        }, 5000)
    });
    req.end();
}

module.exports = {
    help: help,
    execute: execute
}