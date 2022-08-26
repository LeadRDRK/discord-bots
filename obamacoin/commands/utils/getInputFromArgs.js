const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/
const getFileExt = require("./getFileExt");

module.exports = async (msg, args, num) => {
    var fileUrl, fileExt;
    if (args.length > 0) {
        var lastArg = (num != undefined) ? args[num] : args[args.length - 1];
        if (urlRegex.test(lastArg)) {
            fileUrl = lastArg;
        } else if (lastArg.startsWith("<@")) {
            fileUrl = msg.mentions.users.first().displayAvatarURL({format: "png", dynamic: true, size: 512});
        } else if (lastArg.startsWith("<")) {
            var matchRes = lastArg.match(/<(.*?)>/);
            if (matchRes && urlRegex.test(matchRes[1])) fileUrl = matchRes[1];
        } else if (/^\d+$/.test(lastArg) && lastArg.length == 18) {
            var user = await msg.client.users.fetch(lastArg);
            fileUrl = user.displayAvatarURL({format: "png", dynamic: true, size: 512});
        }
        if (fileUrl) {
            fileExt = getFileExt(fileUrl);
        };
    }
    return {
        fileUrl: fileUrl,
        fileExt: fileExt
    }
}