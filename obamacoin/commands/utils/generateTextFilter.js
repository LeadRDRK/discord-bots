const wrap = require('word-wrap');
const writeTextFiles = require("./writeTextFiles");

module.exports = (text, textTemplate, lettersPerLine, lineSpacing, lineLimit, cb) => {
    var wrappedText = wrap(text, {
        width: lettersPerLine,
        indent: ""
    }).split("\n");
    writeTextFiles(wrappedText, fileList => {
        var filter = "";
        for (const [i, line] of fileList.entries()) {
            if (i > lineLimit - 1) break;
            filter += (i == 0 ? "" : ",") +
                    textTemplate.replace("inputText", line)
                                .replace("yoffset", lineSpacing * i);
        }
        cb(filter, fileList);
    });
}