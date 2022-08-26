const ffmpegProcess = require("./utils/ffmpegProcess");
const generateTextFilter = require("./utils/generateTextFilter");

var help = {
    usage: '[j] [fontsize] "<text>"',
    desc: "Generates a Michiru meme.\n" +
          "Use 'j' to enable Japanese text (using a different font), or use a number to specify the font size (default is 128)."
}

var textTemplate_e = "drawtext=fontfile=assets/DkCC.ttf:fontcolor=white:fontsize=128:textfile=inputText:x=200:y=200+yoffset";
var textTemplate_j = textTemplate_e.replace("assets/DkCC.ttf", "assets/Nagurigaki.ttf");
var overlayFilter = "[out][1:v]overlay";
var quoteRegex = /["“](.*?)[”"]/;

function execute(msg, args) {
    // parse options
    var fontSize, japanese;
    for (i = 0; i < 2; ++i) {
        var arg = args[0];
        var num = parseInt(arg);
        if (num) {
            fontSize = num;
        } else if (arg == "j") {
            japanese = true;
        } else {
            break;
        }
        args.shift();
    }

    var argString = args.join(" ");
    var matchRes = argString.match(quoteRegex);
    if (!matchRes) {
        msg.channel.send("Invalid or missing arguments.")
        return;
    }
    var text = matchRes[1];

    var filterGraph = "[0:v]";
    var textTemplate = japanese ? textTemplate_j : textTemplate_e;
    var lineSpacing = 150;
    if (fontSize) {
        textTemplate.replace("fontsize=128", "fontsize=" + fontSize);
        lineSpacing = fontSize + fontSize * 0.171875;
    }
    generateTextFilter(text, textTemplate, 21, lineSpacing, 4, (filter, fileList) => {
        filterGraph += filter + "[out];" + overlayFilter;

        msg.channel.startTyping();
        var ffmpegArgs =  ["-i", "assets/mcr_meme.png", "-i", "assets/mcr_meme_overlay.png", "-filter_complex", filterGraph];
        ffmpegProcess(msg, fileList, ffmpegArgs, "png");
    });
};

module.exports = {
    help: help,
    execute: execute
}