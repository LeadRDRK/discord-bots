const fetchTwoInputFiles = require("./utils/fetchTwoInputFiles");
const ffmpegProcess = require("./utils/ffmpegProcess");
const checkStream = require("./utils/checkStream");
const timeRegex = /^([01]?\d|2[0-3])(:[0-5]\d){1,2}$/;

var help = {
    usage: "[start time] <input1> <input2>",
    desc: "Adds/replaces audio in a video. Optionally, you can specify when the audio starts. Time format: hh:mm:ss",
    aliases: ["replaceaudio", "addmusic", "replacemusic"]
}

var allowedExts = {
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true,
    gif: true,
    mp3: true,
    wav: true,
    ogg: true,
    oga: true,
    wma: true,
    flac: true,
    aiff: true,
    caf: true,
    png: true,
    jpg: true,
    jpeg: true,
    webp: true
}

var filterGraph = "scale=ceil(iw/2)*2:ceil(ih/2)*2";

function execute(msg, args) {
    var itsoffset;
    if (timeRegex.test(args[0])) {
        itsoffset = args[0];
    }

    msg.channel.startTyping();
    fetchTwoInputFiles(msg, args, allowedExts, (files, exts) => {
        checkStream(files[0], "Video", hasVideo => {
            if (!hasVideo) {
                msg.channel.send("No video stream detected for file 1.");
                msg.channel.stopTyping(true);
                return;
            }
            checkStream(files[1], "Audio", hasAudio => {
                if (!hasAudio) {
                    msg.channel.send("No audio stream detected for file 2.");
                    msg.channel.stopTyping(true);
                    return;
                }
                var ffmpegArgs =  ["-i", files[0]];
                var outputExt = exts[0];
                if (itsoffset) ffmpegArgs.push.apply(ffmpegArgs, ["-itsoffset", itsoffset]);
                var part2 = ["-i", files[1], "-map", "0:v", "-async", "1", "-shortest", "-preset", "ultrafast"];
                ffmpegArgs = ffmpegArgs.concat(part2);
                switch (exts[0]) {
                    case "png":
                    case "jpg":
                    case "jpeg":
                    case "webp":
                        ffmpegArgs.unshift.apply(ffmpegArgs, ["-loop", "1"]);
                        ffmpegArgs.push.apply(ffmpegArgs, ["-vf", filterGraph]);
                        outputExt = "mp4";
                        break;
                    case "gif":
                        ffmpegArgs.unshift.apply(ffmpegArgs, ["-stream_loop", "1"]);
                        ffmpegArgs.push.apply(ffmpegArgs, ["-vf", filterGraph]);
                        outputExt = "mp4";
                        break;
                    default:
                        ffmpegArgs.push.apply(ffmpegArgs, ["-c:v", "copy"]);
                        break;
                }
                ffmpegArgs.push.apply(ffmpegArgs, ["-map", "1:a"]);
                ffmpegProcess(msg, files, ffmpegArgs, outputExt);
            })
        })
    })
};

module.exports = {
    help: help,
    execute: execute
}