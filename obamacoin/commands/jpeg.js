const fetchInputFile = require("./utils/fetchInputFile");
const im = require('gm').subClass({ imageMagick: true });
const fs = require('fs');

var help = {
    usage: "<input>",
    desc: "JPEGify an image.",
    aliases: ["jpg", "needsmorejpeg", "crunch2"]
}

var allowedExts = {
    png: true,
    jpg: true,
    jpeg: true,
    bmp: true
}

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, inputFile => {
        im(inputFile)
        .quality(1)
        .toBuffer("JPG", (err, buffer) => {
            if (err) {
                msg.channel.send(err.message);
                fs.unlink(inputFile, () => { });
                msg.channel.stopTyping();
                return;
            }
            msg.channel.send({
                files: [{
                    attachment: buffer,
                    name: "output.jpg"
                }]
            }).then(() => {
                fs.unlink(inputFile, () => { });
                msg.channel.stopTyping();
            });
        });
    });
};

module.exports = {
    help: help,
    execute: execute
}