const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<input>",
    desc: "Adds an 'Unregistered HyperCam 2' watermark onto a video/image.",
    aliases: ["hc", "hc2", "hypercam2"]
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
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected.");
                return;
            }
            var ffmpegArgs =  ["-i", inputFile, "-i", "assets/hypercam.png", "-filter_complex", "[0:v][1:v]overlay", "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}