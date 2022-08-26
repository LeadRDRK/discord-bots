const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "<input>",
    desc: "*Melts* a video."
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true,
    gif: true
}

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            var ffmpegArgs =  ["-i", inputFile, "-vf", "lagfun=decay=.99", "-c:a", "copy"]
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}