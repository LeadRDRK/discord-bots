const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "<input>",
    desc: "Fisheye effect. Kinda.",
    experimental: true
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

var filterGraph = "remap";

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            var ffmpegArgs =  ["-i", inputFile, "-i", "assets/fisheye_grid_xmap.pgm", "-i", "assets/fisheye_grid_ymap.pgm", "-lavfi", filterGraph, "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}