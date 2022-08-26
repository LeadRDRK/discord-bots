const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const generateTextFilter = require("./utils/generateTextFilter");
const fs = require("fs");

var help = {
    usage: "\"[text]\" <input>",
    desc: "Generates an \"I'm Stuff\" meme.",
    aliases: ["imstuff"]
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
var filterGraphTemplate = "[1:v]scale=472:-2[ovr1];" +
                          "[ovr1][0:v]vstack,"
var textTemplate = "drawtext=fontfile=assets/Times.ttf:textfile=inputText:fontsize=30:x=25:y=(h-135)+yoffset"
var quoteRegex = /["“](.*?)[”"]/;

function execute(msg, args) {
    var argString = args.join(" ");
    var matchRes = argString.match(quoteRegex);
    var text = matchRes ? matchRes[1] : "";

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            generateTextFilter(text, textTemplate, 23, 38, 3, (filter, fileList) => {
                var filterGraph = filterGraphTemplate + filter;
                var ffmpegArgs =  ["-i", "assets/stuff.png", "-i", inputFile, "-filter_complex", filterGraph, "-c:a", "copy"];
                ffmpegProcess(msg, [...fileList, inputFile], ffmpegArgs, ext);
            })
        });
    })
};

module.exports = {
    help: help,
    execute: execute,
    timeout: 10
}