const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<input>",
    desc: "Inverts a video/image"
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
    webp: true
}

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Audio", hasAudio => {
            checkStream(inputFile, "Video", hasVideo => {
                if (!hasVideo) {
                    msg.channel.send("No video stream detected.");
                    return;
                }
                var ffmpegArgs =  ["-i", inputFile, "-vf", "negate"];
                if (hasAudio) {
                    ffmpegArgs.push.apply(ffmpegArgs, ["-c:a", "copy"]);
                }
                ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
            })
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}