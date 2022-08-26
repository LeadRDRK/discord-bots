const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "<input>",
    desc: "Generates a 'honey tie me up' meme.",
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

var filterGraph = "[1:v]scale='if(gt(a,324/168),324,-1)':168[ovr1];" +
                  "[0:v][ovr1]overlay=36+((324-overlay_w)/2):658"

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            var ffmpegArgs =  ["-i", "assets/tie_me_up.png", "-i", inputFile, "-filter_complex", filterGraph, "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}