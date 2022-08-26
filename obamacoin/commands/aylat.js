const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const fs = require("fs");

var help = {
    usage: "[time] <input>",
    desc: "ARE YOU LOOKING AT THIS ?<br>" +
          "<code>time</code> is in seconds.",
    aliases: ["areyoulookingatthis"]
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
var filterGraphTemplate = "[0:v]pad=w=if(lt(iw\\,ih*1.5)\\,ceil((ih*1.5)/2)*2\\,iw):x=(iw-ow)/2,split[pv1][pv2];" +
                          "[pv1]select=lte(t\\,time),setpts=PTS-STARTPTS[f2];" +
                          "[pv2]select=between(t\\,time\\,time),setpts=PTS-STARTPTS[f];" +
                          "[1:v]colorkey=0x00DA1F:0.3[t];" +
                          "[t][f]scale2ref=oh*mdar:ih[2nd][ref];" +
                          "[ref][2nd]overlay=x=(main_w-overlay_w)/2[out];" +
                          "[0:a]aselect=lte(t\\,time)[fa];" +
                          "[f2][fa][out][1:a]concat=n=2:v=1:a=1"

var filterGraph_na = "[0:v]pad=w=if(lt(iw\\,ih*1.5)\\,ceil((ih*1.5)/2)*2\\,iw):h=ceil(ih/2)*2:x=(iw-ow)/2[f];" +
                     "[1:v]colorkey=0x00DA1F:0.3[t];" +
                     "[t][f]scale2ref=oh*mdar:ih[2nd][ref];" +
                     "[ref][2nd]overlay=x=(main_w-overlay_w)/2"

function execute(msg, args) {
    var time = parseFloat(args[0]);
    if (isNaN(time)) time = 0;

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected.");
                fs.unlink(inputFile, () => {});
                return;
            }
            checkStream(inputFile, "Audio", hasAudio => {
                var filterGraph;
                if (hasAudio) filterGraph = filterGraphTemplate.replace(/time/g, time)
                else filterGraph = filterGraph_na;

                var ffmpegArgs = ["-i", inputFile, "-i", "assets/aylat.mp4", "-filter_complex", filterGraph, "-preset", "ultrafast"];
                switch (ext) {
                    case "gif":
                    case "png":
                    case "jpg":
                    case "jpeg":
                    case "webp":
                        ext = "mp4";
                        break;
                }
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
