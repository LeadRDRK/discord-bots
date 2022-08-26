const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "[w/h] <input>",
    desc: "Shrinks the resolution of an image/video by half.",
    aliases: ["reduce"]
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true,
    gif: true,
    png: true,
    jpg: true,
    jpeg: true,
    webp: true,
}

function execute(msg, args) {
    var limit = args[0];

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            var scaleFilter = "scale="
            switch (limit) {
                case "w":
                case "width":
                    scaleFilter += "iw/2:ih"
                    break;
                case "h":
                case "height":
                    scaleFilter += "iw:ih/2"
                    break;
                default:
                    scaleFilter += "iw/2:ih/2"
                    break;
            }
            var ffmpegArgs =  ["-i", inputFile, "-vf", scaleFilter, "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}