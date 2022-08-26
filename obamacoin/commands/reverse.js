const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "<input>",
    desc: "Reverses a video."
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

var filterGraph1 = "[0:v]reverse[v];[0:a]areverse[a]"
var filterGraph2 = "[0:v]reverse"

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected.");
                fs.unlink(inputFile, () => {});
                return;
            }
            checkStream(inputFile, "Audio", hasAudio => {
                var ffmpegArgs =  ["-i", inputFile, "-filter_complex", hasAudio ? filterGraph1 : filterGraph2, "-preset", "ultrafast"];
                if (hasAudio) ffmpegArgs.push.apply(ffmpegArgs, ["-map", "[v]", "-map", "[a]"]);
                ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
            })
        })
    })
};

module.exports = {
    help: help,
    execute: execute,
    timeout: 10
}