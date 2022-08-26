const im = require('gm').subClass({imageMagick: true});
const fetchInputFile = require("./utils/fetchInputFile");
const ffmpegProcess = require("./utils/ffmpegProcess");
const fs = require('fs');
const ffmpeg = require("ffmpeg-static");
const { execFile } = require("child_process");
const uuidv4 = require("uuid").v4;
const rimraf = require("rimraf");

var help = {
    usage: "[n] <input>",
    desc: "JPEGify GIFs and videos. Add 'n' if you don't want it to crunch the audio.",
    aliases: ["gjpg"]
}

var allowedExts = {
    gif: true,
    mov: true,
    mkv: true,
    mp4: true,
    avi: true,
    wmv: true,
    webm: true
}

function lqRescaleFrames(folder, files, callback, idx = 0) {
    new Promise((resolve, reject) => {
        var inputFile = folder + "/" + files[idx];
        var outputFile = inputFile.replace("0_", "1_").replace("bmp", "jpg");
        im(inputFile)
        .quality(1)
        .write(outputFile, () => {
            if (idx == files.length - 1) {
                resolve();
            } else {
                reject();
            }
        });
    }).then(() => callback(), () => lqRescaleFrames(folder, files, callback, idx + 1))
}

function sendError(errMsg, msg, inputFile, pFolder) {
    msg.channel.stopTyping();
    msg.channel.send(errMsg);
    fs.unlink(inputFile, () => {});
    rimraf(pFolder, () => {});
}

function execute(msg, args) {
    msg.channel.startTyping();
    fetchInputFile(msg, args, allowedExts, (inputFile, ext) => {
        var pFolder = uuidv4();
        fs.mkdir(pFolder, () => {
            execFile(ffmpeg, ["-i", inputFile, "-vf", "scale=w=min(iw\\,360):h=-2", pFolder + "/0_%d.bmp"], (err, stdout, stderr) => {
                if (err) {
                    sendError("An internal error occured. Error code: " + err.code,
                              msg, inputFile, pFolder);
                    return;
                }
                var matchObj = stderr.match(/Stream #0.*?(\b\d+(?:\.\d+)?\s*fps\b).*/);
                if (!matchObj) {
                    sendError("Error: Couldn't get video frame rate",
                              msg, inputFile, pFolder);
                    return;
                }
                var fps = matchObj[1].replace(" fps", "");
                fs.readdir(pFolder, (err, files) => {
                    if (files.length > 1500) {
                        sendError(":warning: Too many frames in video (limit is 1500 frames)",
                                  msg, inputFile, pFolder);
                        return;
                    }
                    if (err) {
                        sendError("Error: " + err,
                                  msg, inputFile, pFolder);
                        return;
                    }
                    lqRescaleFrames(pFolder, files, () => {
                        var ffmpegArgs = ["-r", fps, "-i", pFolder + "/1_%d.jpg", "-i", inputFile, 
                                          "-map", "0:v", "-map", "-1:v", "-map", "1:a?"];
                        if (ext != "gif" && ext != "webm" && ext != "wmv") {
                            ffmpegArgs.push.apply(ffmpegArgs, ["-c:v", "libx264", "-pix_fmt", "yuv420p"]);
                        }
                        var audioArgs = args[0] == "n" ? ["-c:a", "copy"] : ["-b:a", "16k"];
                        ffmpegArgs.push.apply(ffmpegArgs, audioArgs);
                        ffmpegProcess(msg, inputFile, ffmpegArgs, ext, null, () => {
                            rimraf(pFolder, () => {});
                        });
                    });
                });
            });
        });
    });
}

module.exports = {
    help: help,
    execute: execute,
    timeout: 10
}