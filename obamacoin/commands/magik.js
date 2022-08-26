const im = require('gm').subClass({imageMagick: true});
const fetchInputFile = require("./utils/fetchInputFile");
const fs = require('fs');

var help = {
    usage: "<input>",
    desc: "Liquid rescale/seam carving. Based on NotSoBot."
}

var allowedExts = {
    png: true,
    jpg: true,
    jpeg: true,
    webp: true,
}

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        im(inputFile)
        .out("-liquid-rescale", "50%x50%", "-liquid-rescale", "150%x150%")
        .toBuffer((err, buffer) => {
            msg.channel.stopTyping(true);
            if (err) {
                msg.channel.send(err.message);
                fs.unlink(inputFile, () => {});
                return;
            }
            msg.channel.send({
                files: [{
                    attachment: buffer,
                    name: "output." + ext
                }]
            }).then(() => fs.unlink(inputFile, () => {}));
        });
    });
}

module.exports = {
    help: help,
    execute: execute
}