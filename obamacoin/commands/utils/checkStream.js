const ffmpeg = require("ffmpeg-static");
const { execFile } = require("child_process");

module.exports = (inputFile, stream, cb) => {
    execFile(ffmpeg, ["-i", inputFile], (_, __, stderr) => {
        cb(stderr.includes(stream));
    });
}