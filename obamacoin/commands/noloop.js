const fetchInputFile = require("./utils/fetchInputFile");
const im = require('gm').subClass({ imageMagick: true });
const fs = require('fs');

var help = {
    usage: "<input>",
    desc: "Removes looping from a GIF.",
    aliases: ["disableloop"]
}

var allowedExts = {
    gif: true
}

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        im(inputFile)
        .loop(1)
        .toBuffer("GIF", (err, buffer) => {
            if (err) {
                msg.channel.send(err.message);
                fs.unlink(inputFile, () => { });
                msg.channel.stopTyping();
                return;
            }
            msg.channel.send({
                files: [{
                    attachment: buffer,
                    name: "output.gif"
                }]
            }).then(() => {
                fs.unlink(inputFile, () => { });
                msg.channel.stopTyping();
            });
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}