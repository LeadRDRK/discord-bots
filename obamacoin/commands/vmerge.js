const fetchTwoInputFiles = require("./utils/fetchTwoInputFiles");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<input1> <input2>",
    desc: "Joins two pictures vertically."
}

var allowedExts = {
    png: true,
    jpg: true,
    jpeg: true,
    webp: true
}

var filterGraph = "[0:v][1:v]scale2ref=h=ow/mdar:w=iw[out1][out2];[out1][out2]vstack"

function execute(msg, args) {
    msg.channel.startTyping();
    fetchTwoInputFiles(msg, args, allowedExts, (files, exts) => {
        checkStream(files[0], "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected for file 1.");
                msg.channel.stopTyping(true);
                return;
            }
            checkStream(files[1], "Video", hasVideo => {
                if (!hasVideo) {
                    msg.channel.send("No video stream detected for file 2.");
                    msg.channel.stopTyping(true);
                    return;
                }
                var ffmpegArgs =  ["-i", files[0], "-i", files[1], "-filter_complex", filterGraph, "-c:a", "copy"];
                ffmpegProcess(msg, files, ffmpegArgs, exts[0]);
            })
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}