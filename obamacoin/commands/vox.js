const ffmpegProcess = require("./utils/ffmpegProcess");
const writeTextFiles = require("./utils/writeTextFiles");
const fs = require("fs");

var help = {
    usage: "<text>",
    desc: "Half Life VOX/Black Mesa Announcement System. Note that this have a very limited vocabulary; unsupported words will be skipped."
}

function execute(msg, args) {
    var wordFilesList = "";
    for (var i = 0; i < args.length; i++) {
        var word = args[i].toLowerCase();
        var file = `assets/vox/${word}.wav`
        if (fs.existsSync(file))
            wordFilesList += `file '${file}'\n`;
    }
    writeTextFiles([wordFilesList], fileList => {
        var ffmpegArgs = ["-f", "concat", "-i", fileList[0], "-c", "copy"];
        ffmpegProcess(msg, fileList, ffmpegArgs, "wav");
    })
}

module.exports = {
    help: help,
    execute: execute
}