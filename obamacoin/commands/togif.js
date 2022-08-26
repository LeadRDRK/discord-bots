const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<input>",
    desc: "Converts a video into a gif.<br>" +
          "All videos are (automatically) limited to 15fps, 360px in width and trimmed to 10 seconds.",
    aliases: ["gif"]
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true
}

var filterGraph = "[0:v]fps=15,scale=w=min(iw\\,360):h=-1,split[a][b];[a]palettegen[p];[b][p]paletteuse";

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, _) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected.");
                return;
            }
            var ffmpegArgs =  ["-t", "00:00:10", "-i", inputFile, "-filter_complex", filterGraph];
            ffmpegProcess(msg, inputFile, ffmpegArgs, "gif");
        })
    })
};

module.exports = {
    help: help,
    execute: execute,
    timeout: 10
}