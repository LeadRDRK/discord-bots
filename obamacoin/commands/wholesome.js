const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<input>",
    desc: "WHOLESOME 100 KEANU CHUNGUS MOMENT",
    aliases: ["wholesome100"]
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

var filterGraph = "[0:v][1:v]scale2ref=h=ow/mdar:w=iw[out1][out2];[out1][out2]vstack"

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                msg.channel.stopTyping(true);
                fs.unlink(inputFile, () => {});
                return;
            }
            var ffmpegArgs =  ["-i", inputFile, "-i", "assets/wholesome.png", "-filter_complex", filterGraph, "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}