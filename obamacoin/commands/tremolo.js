const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const argOutOfRange = require("./utils/argOutOfRange");

var help = {
    usage: "[frequency] [depth] <input>",
    desc: "Adds tremolo onto a video/audio.\n" +
          "Default frequency: 10.0 Hz, default depth: 0.5"
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true,
    mp3: true,
    wav: true,
    ogg: true,
    oga: true,
    wma: true,
    flac: true,
    aiff: true,
    caf: true
}

function execute(msg, args) {
    var freq = 10;
    var depth = 0.5;
    for (i = 0; i < 2; ++i) {
        var arg = args[0];
        var num = parseFloat(arg);
        if (isNaN(num)) break;

        if (i == 0) {
            freq = num.toFixed(2);
        } else if (i == 1) {
            depth = num.toFixed(2);
        }
        args.shift();
    }

    if (argOutOfRange(msg.channel, "Frequency", freq, 0.5, 20000)) return;
    if (argOutOfRange(msg.channel, "Depth", depth, 0, 1)) return;

    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        checkStream(inputFile, "Audio", hasAudio => {
            if (!hasAudio) {
                msg.channel.send("No audio stream found.");
                return;
            }
            checkStream(inputFile, "Video", hasVideo => {
                var ffmpegArgs =  ["-i", inputFile, "-af", `tremolo=f=${freq}:d=${depth}`];
                if (hasVideo) {
                    ffmpegArgs.push.apply(ffmpegArgs, ["-c:v", "copy"])
                    if (ext == "mp4" || ext == "mkv" || ext == "avi") {
                        ffmpegArgs.push.apply(ffmpegArgs, ["-c:a", "libmp3lame"])
                    }
                };

                ffmpegProcess(msg, inputFile, ffmpegArgs, ext);
            });
        });
    })
};

module.exports = {
    help: help,
    execute: execute
}