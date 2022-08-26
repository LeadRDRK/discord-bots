const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "\"<text>\" <input>",
    desc: "Adds a Snapchat caption onto your video/image."
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

// oh boy
var filterGraphTemplate = "drawbox=y=ih/1.3:color=black@0.6:width=iw:height=ih/10:t=fill," +
                          "drawtext=fontfile=assets/HelveticaNeueLTStd-Roman.otf:text='inputText':fontcolor=white:fontsize=h/20:x=(w-tw)/2:y=(h/1.3)+((h/10)/2-th/2)"

var quoteRegex = /["“](.*?)[”"]/;

function execute(msg, args) {
    var argString = args.join(" ");
    var matchRes = argString.match(quoteRegex);
    if (!matchRes) {
        msg.channel.send("Invalid or missing arguments.");
        return;
    }
    var inputText = matchRes[1]
                    .replace(/:/g, "\\:").replace(/'/g, "");

    var endIndex = matchRes[0].length;
    args = argString[endIndex] == " " ? argString.slice(endIndex + 1).split(" ") : [];

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            var filterGraph = filterGraphTemplate.replace(/inputText/g, inputText);
            var ffmpegArgs =  ["-i", inputFile, "-vf", filterGraph, "-c:a", "copy"];
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}