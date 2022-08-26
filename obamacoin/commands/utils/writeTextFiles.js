var fs = require("fs");
var uuidv4 = require("uuid").v4;

function writeTextFiles(textList, cb) {
    var fileList = [];
    for (let i = 0, p = Promise.resolve(); i < textList.length; i++) {
        p = p.then(() => new Promise(resolve => {
            var filename = uuidv4() + ".txt"
            var text = textList[i];
            fs.writeFile(filename, text, (err) => {
                fileList.push(filename);
                if (i == textList.length - 1) cb(fileList)
                else resolve();
            });
        }))
    }
}

module.exports = writeTextFiles;