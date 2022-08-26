const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");

var help = {
    usage: "<input>",
    desc: "Adds the Sanctuary Guardian music from Earthbound to an image (aka the music that's used in \"HOW\" memes)"
}

var allowedExts = {
    png: true,
    jpg: true,
    jpeg: true,
    webp: true
}

var filterGraph = "scale=ceil(iw/2)*2:ceil(ih/2)*2";

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, _) => {
        var ffmpegArgs = ["-loop", "1", "-i", inputFile, "-i", "assets/how.m4a", "-async", "1", "-shortest", 
                          "-vf", filterGraph, "-c:a", "copy"];
        ffmpegProcess(msg, inputFile, ffmpegArgs, "mp4");
    })
};

module.exports = {
    help: help,
    execute: execute
}