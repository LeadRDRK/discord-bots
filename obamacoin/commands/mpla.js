const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "[time] <input>",
    desc: "STOP WATCHING THIS BROTHER<br>" +
          "WE MUST FIGHT THE MPLA<br><br>" +
          "<code>time</code> is in seconds."
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true,
    /*
    gif: true,
    png: true,
    jpg: true,
    jpeg: true,
    webp: true
    */
}
var filterGraph = "[0:v]pad=w=if(lt(iw\\,ih*(16/9))\\,ceil((ih*(16/9))/2)*2\\,iw):x=(iw-ow)/2,setsar=1:1[pv];" +
                  "[1:v][pv]scale2ref=ceil(oh*mdar/2)*2:ih[2nd][ref];" +
                  "[2nd]setsar=1:1[2nd_s];" +
                  "[ref][0:a][2nd_s][1:a]concat=n=2:v=1:a=1"

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected.");
                fs.unlink(inputFile, () => { });
                return;
            }
            checkStream(inputFile, "Audio", hasAudio => {
                if (!hasAudio) {
                    msg.channel.send("No audio stream detected.");
                    fs.unlink(inputFile, () => { });
                    return;
                }
                var ffmpegArgs = ["-t", args[0], "-i", inputFile, "-i", "assets/mpla.mp4", "-filter_complex", filterGraph, "-preset", "ultrafast"];
                ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
            })
        })
    })
};

module.exports = {
    help: help,
    execute: execute,
    timeout: 10
}
