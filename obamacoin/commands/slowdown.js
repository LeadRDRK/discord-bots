const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");

var help = {
    usage: "[multiplier] <input>",
    desc: "Slows down the attached video/animated GIF. Optionally, you can specify the speed multiplier (default is 2)",
    aliases: ["slomo", "slowmo", "slowmotion"]
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true,
    gif: true,
}

function execute(msg, args) {
    var ptsMultiplier = 2;
    var tempo = 0.5;
    if (args[0]) {
        var usrMultiplier = parseFloat(args[0]);
        if (!isNaN(usrMultiplier)) {
            if (usrMultiplier <= 1) {
                msg.channel.send("Multiplier cannot be smaller than or equal to 1.");
                return;
            }
            if (usrMultiplier > 6) {
                msg.channel.send("Multiplier must be smaller than or equal to 6.");
                return;
            }
            ptsMultiplier = usrMultiplier.toFixed(2);
            tempo = 1 / usrMultiplier;
            args.shift();
        }
    }
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Audio", hasAudio => {
            var filterGraph = `[0:v]setpts=${ptsMultiplier}*PTS[v]`;
            if (hasAudio) {
                if (tempo < 0.5) {
                    filterGraph += `;[0:a]atempo=0.5,atempo=${1 - tempo}[a]`
                //} else if (tempo < 0.5) {
                //    filterGraph += `;[0:a]atempo=0.5,atempo=${1 - (0.5 - tempo)}[a]`
                } else {
                    filterGraph += `;[0:a]atempo=${tempo}[a]`
                }
            }
            var ffmpegArgs =  ["-i", inputFile, "-filter_complex", filterGraph, "-map", "[v]", "-preset", "ultrafast"];
            if (hasAudio) {
                ffmpegArgs.push.apply(ffmpegArgs, ["-map", "[a]"])
            }
            ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}