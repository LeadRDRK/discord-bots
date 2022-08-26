const ytdl = require("youtube-dl");

var handlers = {}

handlers["tenor.com"] = url => {
    return new Promise(resolve => {
        if (!url.includes(".gif")) resolve(url += ".gif")
        else resolve(url);
    })
}

handlers["gyazo.com"] = handlers["tenor.com"];

handlers["giphy.com"] = url => {
    return new Promise(resolve => {
        var matchRes = url.match(/[^-]+$/);
        if (matchRes) resolve("https://i.giphy.com/media/" + matchRes[0] + "/giphy.gif")
        else resolve(url);
    })
}

function ytdlHandler(url) {
    return new Promise(resolve => {
        ytdl.getInfo(url, (_, info) => {
            resolve(info ? info.url : "");
        })
    })
}

handlers["youtube.com"] = ytdlHandler;
handlers["twitter.com"] = ytdlHandler;
handlers["tumblr.com"] = ytdlHandler;
handlers["soundcloud.com"] = ytdlHandler;
handlers["bandcamp.com"] = ytdlHandler;
handlers["drive.google.com"] = ytdlHandler;
handlers["nicovideo.jp"] = ytdlHandler;
handlers["gfycat.com"] = ytdlHandler;

module.exports = url => {
    if (url.startsWith("http://")) url = url.replace("http://", "https://");
    if (url.endsWith("/")) url = url.replace(/\/+$/, "");
    var hostname = new URL(url).hostname;
    if (hostname.startsWith("www.")) hostname = hostname.replace("www.", "");
    if (handlers[hostname]) return handlers[hostname](url);
    else if (hostname.endsWith("bandcamp.com")) return handlers["bandcamp.com"](url); // because bandcamp uses subdomains
    else {
        return new Promise(resolve => {
            resolve(url);
        });
    };
}