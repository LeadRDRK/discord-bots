const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const writeTextFiles = require("./utils/writeTextFiles");
const fs = require("fs");

var help = {
    usage: "\"<top text>\" \"[bottom text]\" [font size] <input>",
    desc: "Generates a meme. Works with both images and videos."
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
var tPrefix = "drawtext=fontfile=assets/impact.ttf:textfile=topText:fontcolor=black:fontsize=fs";
var tPrefix2 = tPrefix.replace("black", "white");
var bPrefix = "drawtext=fontfile=assets/impact.ttf:textfile=bottomText:fontcolor=black:fontsize=fs";
var bPrefix2 = bPrefix.replace("black", "white");
var filterGraphTemplate = // top text
                          `${tPrefix}:x=(w-tw)/2-(fs)/20:y=h/100,` +
                          `${tPrefix}:x=(w-tw)/2-(fs)/20:y=h/50,` +
                          `${tPrefix}:x=(w-tw)/2+(fs)/20:y=h/100,` +
                          `${tPrefix}:x=(w-tw)/2+(fs)/20:y=h/50,` +
                          `${tPrefix2}:x=(w-tw)/2:y=h/65,` +
                          // bottom text
                          `${bPrefix}:x=(w-tw)/2-(fs)/20:y=h-((fs)*0.85+(h/100)),` +
                          `${bPrefix}:x=(w-tw)/2-(fs)/20:y=h-((fs)*0.85+(h/50)),` +
                          `${bPrefix}:x=(w-tw)/2+(fs)/20:y=h-((fs)*0.85+(h/100)),` +
                          `${bPrefix}:x=(w-tw)/2+(fs)/20:y=h-((fs)*0.85+(h/50)),` +
                          `${bPrefix2}:x=(w-tw)/2:y=h-((fs)*0.85+(h/65))`
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
        bottomText = matchRes2[1].toUpperCase();
    }

    var endIndex = matchRes1[0].length + (matchRes2 ? matchRes2[0].length + 1 : 0);
    args = argString[endIndex] == " " ? argString.slice(endIndex + 1).split(" ") : [];

    var fontSize = "h/10";
    if (/^\d+$/.test(args[0])) {
        fontSize = args[0];
        args.shift();
    }

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                msg.channel.stopTyping(true);
                fs.unlink(inputFile, () => {});
                return;
            }
            writeTextFiles([topText, bottomText], fileList => {
                var filterGraph = filterGraphTemplate.replace(/topText/g, fileList[0])
                                                    .replace(/bottomText/g, fileList[1])
                                                    .replace(/fs/g, fontSize);
                var ffmpegArgs =  ["-i", inputFile, "-vf", filterGraph, "-c:a", "copy"];
                ffmpegProcess(msg, [...fileList, inputFile], ffmpegArgs, ext);
            })
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}