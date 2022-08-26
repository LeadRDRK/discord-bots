const { https } = require("follow-redirects");
const fs = require("fs");
const uuidv4 = require("uuid").v4;
const getFileExt = require("./getFileExt");
const getInputFromArgs = require("./getInputFromArgs");
const getDownloadLink = require("./getDownloadLink");
const urlRegex = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/;
const sizeLimit = 12582912;

module.exports = async (msg, args, allowedExts, cb) => {
    var fileUrl, fileExt;
    var argInput = await getInputFromArgs(msg, args);
    if (argInput.fileUrl) {
        fileUrl = argInput.fileUrl;
        fileExt = argInput.fileExt;
    } else {
        if (msg.attachments.size > 0) {
            var attachment = msg.attachments.last();
            var ext = getFileExt(attachment.name);
            if (!allowedExts[ext]) {
                msg.channel.send("File not supported.");
                return;
            }
            fileUrl = attachment.url;
            fileExt = ext;
        } else { // attempt to fetch file from prev messages
            var lastMessages = msg.channel.messages.cache.last(30);
            lastMessages.reverse().some(message => {
                if (urlRegex.test(message.content)) {
                    var matchRes = message.content.match(urlRegex);
                    if (!matchRes) return false;
                    var url = matchRes[0];
                    var ext = getFileExt(url);
                    //if (allowedExts[ext]) {
                        fileUrl = url;
                        fileExt = ext;
                        return true;
                    //}
                } else if (message.attachments.size > 0) {
                    var attachment = message.attachments.last();
                    var ext = getFileExt(attachment.name);
                    if (allowedExts[ext]) {
                        fileUrl = attachment.url;
                        fileExt = ext;
                        return true; // break
                    }
                } else if (message.embeds.length > 0) {
                    var lastEmbed = message.embeds[message.embeds.length - 1];
                    var image = lastEmbed.image;
                    if (image) {
                        var ext = getFileExt(image.url);
                        if (allowedExts[ext]) {
                            fileUrl = image.url;
                            fileExt = ext;
                            return true;
                        }
                    }
                }
            });
        }
    }
    if (!fileUrl) {
        msg.channel.send("No file to process.");
        msg.channel.stopTyping(true);
        return;
    }
    try {
        const dlLink = await getDownloadLink(fileUrl);
        https.get(dlLink, res => {
            var size = res.headers["content-length"];
            if (size && size > sizeLimit) {
                msg.channel.send(":warning: File too large ! Size limit: 12MiB.");
                msg.channel.stopTyping(true);
                return;
            }
            var serverExt = res.headers["content-type"].split("/").pop().toLowerCase();
            if (allowedExts[serverExt] || allowedExts[fileExt]) {
                var ext = allowedExts[serverExt] ? serverExt : fileExt;
                var file = `${uuidv4()}.${ext}`
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
                        fs.unlink(file, () => {});
                        return;
                    }
                    cb(file, ext);
                });
            } else {
                msg.channel.send("File not supported.")
                msg.channel.stopTyping(true);
            }
        }).on("error", err => {
       	    msg.channel.send("Error: " + err.message);
            msg.channel.stopTyping(true);
            console.log(err.stack);
        })
    } catch (err) {
        msg.channel.send("Error: " + err.message);
        msg.channel.stopTyping(true);
        console.log(err.stack);
    }
}
