const ffmpeg = require("ffmpeg-static");
const { execFile } = require("child_process");

module.exports = (inputFile, cb) => {
    execFile(ffmpeg, ["-i", inputFile], (_, __, stderr) => {
        var matchRes = stderr.match(/\s+Duration: ((\d\d):(\d\d):(\d\d)\.(\d+))/);
        cb({
            full: matchRes[1],
            hours: matchRes[2],
            minutes: matchRes[3],
            seconds: matchRes[4],
            fseconds: matchRes[5]
        })
    });
}