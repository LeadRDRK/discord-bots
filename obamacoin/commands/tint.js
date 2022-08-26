const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "<r> [g] [b] <input>",
    desc: "Applies a tint to a video/image. Uses RGB values (0 - 255)."
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

var filterGraph = "drawbox=width=iw:height=ih:t=fill:color="

function execute(msg, args) {
    var color = "0x";
    for (var i = 0; i < 3; i++) {
        var num = parseInt(args[i]);
        if (num) {
            if (num > 255) {
                msg.channel.send("Invalid color value: " + num);
                return;
            }
            var hex = num.toString(16);
            var paddedHex = hex.length == 1 ? ("0" + hex) : hex;
            color += paddedHex;
        } else color += "00";
    }
    color += "@0.25"

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected.");
                return;
            }
            var ffmpegArgs =  ["-i", inputFile, "-vf", filterGraph + color, "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}