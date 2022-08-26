const { https } = require("follow-redirects");
const fs = require("fs");
const uuidv4 = require("uuid").v4;
const getInputFromArgs = require("./getInputFromArgs");
const getFileExt = require("./getFileExt");
const getDownloadLink = require("./getDownloadLink");
const urlRegex = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/;
const sizeLimit = 12582912;

module.exports = async (msg, args, allowedExts, cb) => {
    var filesInfo = [];
    for (const [index] of args.entries()) {
        var argInput = await getInputFromArgs(msg, args, index);
        if (argInput.fileUrl) filesInfo.push(argInput);
    }

    if (filesInfo.length < 2) {
        // fetch file from prev messages
        var lastMessages = msg.channel.messages.cache.last(30);
        lastMessages.reverse().some(message => {
            if (urlRegex.test(message.content)) {
                var matchRes = message.content.match(urlRegex);
                if (!matchRes) return false;
                var url = matchRes[0];
                var ext = getFileExt(url);
                //if (allowedExts[ext]) {
                filesInfo.unshift({
                    fileUrl: url,
                    fileExt: ext
                });
                //}
            } else if (message.attachments.size > 0) {
                var attachment = message.attachments.last();
                var ext = getFileExt(attachment.name);
                if (allowedExts[ext]) {
                    filesInfo.unshift({
                        fileUrl: attachment.url,
                        fileExt: ext
                    });
                }
            } else if (message.embeds.length > 0) {
                var lastEmbed = message.embeds[message.embeds.length - 1];
                var image = lastEmbed.image;
                if (image) {
                    var ext = getFileExt(image.url);
                    if (allowedExts[ext]) {
                        filesInfo.unshift({
                            fileUrl: image.url,
                            fileExt: ext
                        });
                    }
                }
            }
            if (filesInfo.length == 2) return true; // break
        });
    }

    if (filesInfo.length < 2) {
        msg.channel.send("Missing input files.");
        msg.channel.stopTyping(true);
        return;
    }
    // just some extra precaution
    filesInfo = filesInfo.slice(0, 3);

    var files = [],
        exts = []
    for (let i = 0, p = Promise.resolve(); i < filesInfo.length; i++) {
        p = p.then(() => new Promise(async (resolve, reject) => {
            try {
                var fileInfo = filesInfo[i];
                var file;
                const dlLink = await getDownloadLink(fileInfo.fileUrl);
                https.get(dlLink, res => {
                    var size = res.headers["content-length"];
                    if (size && size > sizeLimit) {
                        msg.channel.send(":warning: File too large ! Size limit: 12MiB.");
                        msg.channel.stopTyping(true);
                        return;
                    }
                    var serverExt = res.headers["content-type"].split("/").pop().toLowerCase();
                    if (serverExt == "mpeg" && dlLink.includes("mp3")) {
                        // guessing the extension is mp3 ?
                        serverExt = "mp3";
                    }
                    if (allowedExts[serverExt] || allowedExts[fileInfo.fileExt]) {
                        var ext = allowedExts[serverExt] ? serverExt : fileInfo.fileExt;
                        file = `${uuidv4()}.${ext}`
                        var fileStream = fs.createWriteStream(file);
                        res.pipe(fileStream);
                        var size = 0;
                        res.on("data", chunk => {
                            size += chunk.length;
                        })
                        fileStream.on("finish", () => {
                            if (size > sizeLimit) {
                                msg.channel.send(":warning: File too large ! Size limit: 12MiB.");
                                msg.channel.stopTyping(true);
                                fs.unlink(file, () => { });
                                return;
                            }
                            files.push(file)
                            exts.push(ext);
                            if (i == filesInfo.length - 1) cb(files, exts)
                            else resolve();
                        });
                    } else {
                        reject("File not supported: `" + fileInfo.fileUrl + "`");
                    }
                }).on("error", err => {
                    if (file) fs.unlink(file, () => { });
                    reject("Error: " + err.message);
                })
            } catch (err) {
                reject("Error: " + err.message);
            }
        }), error => {
            msg.channel.send(error);
            msg.channel.stopTyping(true);
        });
    }
}
