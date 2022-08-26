const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const writeTextFiles = require("./utils/writeTextFiles");
const fs = require("fs");

var help = {
    usage: "\"<line 1>\" \"[line 2]\" <input>",
    desc: "Generates a meme with a white rectangle and bold text on top. Supports images and videos."
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
var filterGraphTemplate1 = "pad=height=ih+ih/6:y=ih/6," +
                           "drawbox=w=iw:h=ih/6:c=white:t=fill," +
                           "drawtext=textfile=inputText:fontfile=assets/futura-pt-ceb.otf:x=(w-tw)/2:y=((h/6)-th)/2:fontsize=h/14"

var filterGraphTemplate2 = "pad=height=ih+ih/4.5:y=ih/4.5," +
                           "drawbox=w=iw:h=ih/4.5:c=white:t=fill," +
                           "drawtext=textfile=topText:fontfile=assets/futura-pt-ceb.otf:x=(w-tw)/2:y=((h/4.5)-th)/4.15:fontsize=h/14," +
                           "drawtext=textfile=bottomText:fontfile=assets/futura-pt-ceb.otf:x=(w-tw)/2:y=(((h/4.5)-th)/4.15)+(h/14):fontsize=h/14"

var quoteRegex = /["“](.*?)[”"]/;

function execute(msg, args) {
    var argString = args.join(" ");
    var matchRes1 = argString.match(quoteRegex);
    if (!matchRes1) {
        msg.channel.send("Invalid or missing arguments.");
        return;
    }
    var topText = matchRes1[1];
    var matchRes2 = argString.slice(matchRes1[0].length).match(quoteRegex);
    var bottomText = "";
    if (matchRes2) {
        bottomText = matchRes2[1];
    }

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream found.");
                fs.unlink(inputFile, () => {});
                return;
            }
            writeTextFiles([topText, bottomText], fileList => {
                var filterGraph;
                if (bottomText) {
                    filterGraph = filterGraphTemplate2.replace(/topText/g, fileList[0])
                                                      .replace(/bottomText/g, fileList[1]);
                } else {
                    filterGraph = filterGraphTemplate1.replace(/inputText/g, fileList[0]);
                }
                var ffmpegArgs =  ["-i", inputFile, "-filter_complex", filterGraph, "-c:a", "copy"];
                ffmpegProcess(msg, [...fileList, inputFile], ffmpegArgs, ext);
            });
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}