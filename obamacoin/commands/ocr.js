const fetchInputFile = require("./utils/fetchInputFile");
const { createWorker } = require('tesseract.js');
const fs = require("fs");

var help = {
    usage: "[language] <input>",
    desc: "Reads text from an image using Tesseract OCR.<br>"+
          "Supported languages: eng, vie, jpn<br>" +
          "Default language is English."
}

var allowedExts = {
    png: true,
    jpg: true,
    jpeg: true,
    webp: true,
}

var supportedLanguages = ["eng", "vie", "jpn"];

function execute(msg, args) {
    return; // TODO
    var language = "eng";
    if (supportedLanguages.includes(args[0])) language = args[0];

    fetchInputFile(msg, args, allowedExts, async inputFile => {
        msg.channel.startTyping();
        const worker = createWorker();
        await worker.load();
        await worker.loadLanguage(language);
        await worker.initialize(language);
        const { data } = await worker.recognize(inputFile);

        var text = "";
        for (line of data.lines) {
            for (word of line.words) {
                for (symbol of word.symbols) {
                    if (symbol.confidence > 80) {
                        text += symbol.text;
                    }
                }
                text += " ";
            }
            text += "\n";
        }
        
        msg.channel.send("```" + text + "```");
        msg.channel.stopTyping();
        fs.unlink(inputFile, () => {});
        worker.terminate();
    });
}

module.exports = {
    help: help,
    execute: execute
}
