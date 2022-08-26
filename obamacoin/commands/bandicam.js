const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<input>",
    desc: "Adds a Bandicam watermark onto a video/image.",
    aliases: ["bdcam"]
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

var filterGraph = "[1:v][0:v]scale2ref=w=oh*mdar:h=ih/12[main][ovrl],[ovrl][main]overlay=(main_w-overlay_w)/2:0"

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected.");
                return;
            }
            var ffmpegArgs =  ["-i", inputFile, "-i", "assets/bandicam.png", "-filter_complex", filterGraph, "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}