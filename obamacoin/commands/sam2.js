const child_process = require("child_process");
const fs = require("fs");
const uuidv4 = require("uuid").v4;
const notEmpty = /\S/;

var help = {
    usage: "<text>",
    desc: "S.A.M. - The Software Automatic Mouth"
}

function execute(msg, args) {
    var filename = uuidv4() + ".wav"
    var samArgs = ["-wav", filename]
    if (args[0] == "phonetic") {
        samArgs.push("-phonetic");
        args.shift();
    }
    var input = args.join(" ").substr(0, 256).replace(/\r?\n|\r/g, " ");
    if (!input.trim().length) {
        msg.channel.send("No text provided.");
        return;
    }
    samArgs.push(input);
    child_process.execFile("commands/utils/sam", samArgs, err => {
        if (err) {
            switch (err.code) {
                case 1:
                case 2:
                    msg.channel.send("Invalid input.");
                    break;
                // case 139:
                default:
                    msg.channel.send("An unexpected error occured.");
                    break;
            }
            return;
        }
        msg.channel.send({
            files: [{
                attachment: filename,
                name: "sam.wav"
            }]
        })
        .then(() => fs.unlink(filename, () => {}));
    });
};

module.exports = {
    help: help,
    execute: execute
}
