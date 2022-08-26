const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const writeTextFiles = require("./utils/writeTextFiles");
const fs = require("fs");

var help = {
    usage: "\"<text>\" <input>",
    desc: "Our content monitors have determined that your behavior at Roblox has been in violation of our Terms of Service. We will terminate your account if you do not abide by the rules.",
    aliases: ["banned"]
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
var filterGraphTemplate = "[1:v]scale='if(gt(a,362/170),362,-1)':170[ovr1];" +
                          "[0:v][ovr1]overlay=(main_w-overlay_w)/2:257," +
                          "drawtext=fontfile=assets/SourceSans.ttf:textfile=inputText:x=138:y=217:fontsize=12:alpha=0.6," +
                          // fake anti-aliasing/hinting (yeah, i know)
                          "drawtext=fontfile=assets/SourceSans.ttf:textfile=inputText:x=137:y=217:fontsize=12:alpha=0.05," +
                          "drawtext=fontfile=assets/SourceSans.ttf:textfile=inputText:x=139:y=217:fontsize=12:alpha=0.05"
var quoteRegex = /["“](.*?)[”"]/;

function execute(msg, args) {
    var argString = args.join(" ");
    var matchRes = argString.match(quoteRegex);
    if (!matchRes) {
        msg.channel.send("Invalid or missing arguments.");
        return;
    }
    var inputText = matchRes[1];

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            writeTextFiles([inputText], fileList => {
                var filterGraph = filterGraphTemplate.replace(/inputText/g, fileList[0])
                var ffmpegArgs =  ["-i", "assets/robloxban.png", "-i", inputFile, "-filter_complex", filterGraph, "-c:a", "copy"];
                ffmpegProcess(msg, [fileList[0], inputFile], ffmpegArgs, ext);
            })
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}