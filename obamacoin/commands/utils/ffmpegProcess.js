const fs = require("fs");
const uuidv4 = require("uuid").v4;
const ffmpeg = require("ffmpeg-static");
const { execFile } = require("child_process");
const catboxUploader = require("./catboxUploader");
const version = require("../../version");
const encoderStr = "encoder=balls v" + version.string + " (ballsbot.herokuapp.com)";
const encoderArgs = ["-metadata:s:v", encoderStr, "-metadata:s:a", encoderStr];
const sizeLimit = 3000;

function removeInputFile(inputFile) {
    if (typeof inputFile == "string")
        fs.unlink(inputFile, () => { });
    else {
        for (file of inputFile) {
            fs.unlink(file, () => { });
        }
    }
}

module.exports = (msg, inputFile, ffmpegArgs, ext, cb, cb2) => {
    // encode all webm files to mp4 due to memory issues
    if (ext == "webm") ext = "mp4";
    var outputFile = `${uuidv4()}.${ext}`;

    // pix fmt fix
    switch (ext) {
        case "mov":
        case "mkv":
        case "mp4":
        case "avi":
        case "wmv":
        case "webm":
            ffmpegArgs.push.apply(ffmpegArgs, ["-pix_fmt", "yuv420p"]);
            break;
    }
    // encoder tags
    ffmpegArgs.push.apply(ffmpegArgs, encoderArgs);

    ffmpegArgs.push(outputFile);

    execFile(ffmpeg, ["-i", typeof inputFile == "string" ? inputFile : inputFile[0]], (_, __, stderr) => {
        if (stderr.includes("Video")) {
            // verify dimensions
            var matchRes = stderr.match(/(\d+x\d+)/g);
            if (!matchRes) {
                msg.channel.send("Error: Can't read video/image's dimensions.");
                msg.channel.stopTyping(true);
                removeInputFile(inputFile);
                return;
            }
            matchRes = matchRes.filter(str => !str.startsWith("0"));
            var dimensions = matchRes[0].split("x");
            if (dimensions[0] > sizeLimit || dimensions[1] > sizeLimit) {
                msg.channel.send(`Error: Media exceeded resolution limit (${sizeLimit}x${sizeLimit})`);
                msg.channel.stopTyping(true);
                removeInputFile(inputFile);
                return;
            }
        }
        execFile(ffmpeg, ffmpegArgs, err => {
            if (inputFile) {
                removeInputFile(inputFile);
            }
            if (err) {
                if (err.code == null) {
                    msg.channel.send("Process terminated due to high resource usage. Please try another file.");
                } else {
                    msg.channel.send("An internal error occured. Error code: " + err.code);
                    console.log(err.message);
                }
                fs.unlink(outputFile, () => { });
                msg.channel.stopTyping(true);
                return;
            }
            if (cb) {
                cb(outputFile);
            } else {
                msg.channel.send({
                    files: [{
                        attachment: outputFile,
                        name: "output." + ext
                    }]
                }).then(() => {
                    fs.unlink(outputFile, () => { });
                    msg.channel.stopTyping(true);
                    if (cb2) cb2();
                }).catch(err => {
                    msg.channel.send(":warning: Output file too large for Discord, uploading to catbox.moe...");
                    catboxUploader(outputFile, (err, fileUrl) => {
                        fs.unlink(outputFile, () => {});
                        if (err) {
                            msg.channel.send("API Error " + err);
                            msg.channel.stopTyping(true);
                            return;
                        }
                        msg.channel.send(fileUrl);
                    });
                })
            }
        })
    })
}