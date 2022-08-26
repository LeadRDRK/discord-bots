const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const generateTextFilter = require("./utils/generateTextFilter");
const fs = require("fs");

var help = {
    usage: "\"[text]\" <input>",
    desc: "Generates a TF2 alert dialog with text and an image.",
    aliases: ["alert"]
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
var filterGraphTemplate = "[1:v]scale='if(gt(a,284/186),284,-1)':186[ovr1];" +
                          "[0:v][ovr1]overlay=391+(284-overlay_w)/2:154,"
var textTemplate = "drawtext=fontfile=assets/tf2build.ttf:textfile=inputText:fontcolor=white:fontsize=17:x=284+(490-tw)/2:y=363+yoffset"
var quoteRegex = /["“](.*?)[”"]/;

function execute(msg, args) {
    var argString = args.join(" ");
    var matchRes = argString.match(quoteRegex);
    var text = matchRes ? matchRes[1].toUpperCase() : "";

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            generateTextFilter(text, textTemplate, 40, 19, 7, (filter, fileList) => {
                var filterGraph = filterGraphTemplate + filter;
                var ffmpegArgs =  ["-i", "assets/tf2.png", "-i", inputFile, "-filter_complex", filterGraph, "-c:a", "copy"];
                ffmpegProcess(msg, [...fileList, inputFile], ffmpegArgs, ext);
            });
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}