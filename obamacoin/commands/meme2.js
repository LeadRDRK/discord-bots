const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const writeTextFiles = require("./utils/writeTextFiles");
const fs = require("fs");

var help = {
    usage: "\"<top text>\" \"[bottom text]\" <input>",
    desc: "Generates a demotivational meme. Supports images and videos.",
    aliases: ["demotivator", "motivator"]
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
var filterGraphTemplate = "[1:v]scale='if(gt(a,348/218),348,-1)':218[ovr1];" +
                          "[0:v][ovr1]overlay=(main_w-overlay_w)/2:35," +
                          "drawtext=fontfile=assets/Times.ttf:textfile=topText:x=(w-tw)/2:y=267:fontcolor=white:fontsize=45," +
                          "drawtext=fontfile=assets/Helvetica.ttf:fontcolor=white:textfile=bottomText:x=(w-tw)/2:y=309:fontsize=15"
var quoteRegex = /["“](.*?)[”"]/;

function execute(msg, args) {
    var argString = args.join(" ");
    var matchRes1 = argString.match(quoteRegex);
    if (!matchRes1) {
        msg.channel.send("Invalid or missing arguments.");
        return;
    }
    var topText = matchRes1[1].toUpperCase();
    var matchRes2 = argString.slice(matchRes1[0].length).match(quoteRegex);
    var bottomText = "";
    if (matchRes2) {
        bottomText = matchRes2[1];
    }

    var endIndex = matchRes1[0].length + (matchRes2 ? matchRes2[0].length + 1 : 0);
    args = argString[endIndex] == " " ? argString.slice(endIndex + 1).split(" ") : [];

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            writeTextFiles([topText, bottomText], fileList => {
                var filterGraph = filterGraphTemplate.replace(/topText/g, fileList[0])
                                                     .replace(/bottomText/g, fileList[1]);
                var ffmpegArgs =  ["-i", "assets/demotivator.png", "-i", inputFile, "-filter_complex", filterGraph, "-c:a", "copy"];
                ffmpegProcess(msg, [...fileList, inputFile], ffmpegArgs, ext);
            })
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}