const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<input>",
    desc: "Compresses an image/video to the worst quality possible."
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true,
    png: true,
    jpg: true,
    jpeg: true,
    webp: true
}

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Audio", hasAudio => {
            var ffmpegArgs =  ["-i", inputFile, "-q:v", "51"];
            if (hasAudio) {
                ffmpegArgs.push.apply(ffmpegArgs, ["-b:a", "32k"]);
            }
            if (ext == "png" || ext == "jpg" || ext == "jpeg" || ext == "webp") {
                ffmpegProcess(msg, inputFile, ffmpegArgs, "jpg");
            } else {
                ffmpegArgs.push.apply(ffmpegArgs, ["-b:v", "64k", "-vf", "fps=15"]);
                ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
            }
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}