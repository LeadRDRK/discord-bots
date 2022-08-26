const https = require("https");
const Discord = require("discord.js");

var help = {
    usage: "<query>",
    desc: "Searches for images using DuckDuckGo.",
    aliases: ["image", "imagesearch"]
}

var headers = {
    'authority': 'duckduckgo.com',
    'accept': 'application/json, text/javascript, */*; q=0.01',
    'sec-fetch-dest': 'empty',
    'x-requested-with': 'XMLHttpRequest',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
    'referer': 'https://duckduckgo.com/',
    'accept-language': 'en-US,en;q=0.9',
}

function getBody(res, cb) {
    var body = "";
    res.on("data", chunk => {
        body += chunk;
    }).on("end", () => {
        cb(body);
    });
}

function execute(msg, args, enableInt) {
    // keep this update to date with the python version !!!
    if (args.length < 0) {
        msg.channel.send("Missing arguments.");
        return;
    }
    msg.channel.startTyping();
    var keywords = args.join(" ");
    var url = "https://duckduckgo.com/";
    var params = new URLSearchParams({
    	q: keywords
    });

    // console.log("Hitting DuckDuckGo for Token");

    //  First make a request to above URL, and parse out the 'vqd'
    //  This is a special token, which should be used in the subsequent request
    var req = https.get(url + '?' + params.toString(), res => {
        getBody(res, body => {
            var matchObj = body.match(/vqd=([\d-]+)\&/);
            if (!matchObj) {
                // console.error("Token Parsing Failed !");
                msg.channel.send("Failed to parse search token.");
                return;
            }
            // console.log("Obtained Token");
            var params = new URLSearchParams({
                'l': 'us-en',
                'o': 'json',
                'q': keywords,
                'vqd': matchObj[1],
                'f': ',,,',
                'p': '1',
                'v7exp': 'a',
            });
            var requestUrl = url + "i.js";
            // console.log("Hitting Url : " + requestUrl);
            var req = https.get(requestUrl + '?' + params.toString(), {headers: headers}, res => {
                getBody(res, body => {
                    var data = JSON.parse(body);
                    var results = data.results;
                    if (!results || results.length == 0) {
                        msg.channel.send("No results found.");
                        msg.channel.stopTyping(true);
                        return;
                    }
                    var embed = new Discord.MessageEmbed()
                    .setColor(3447003)
                    .setTitle(`Image Search Results for '${keywords}'`)
                    .setFooter("Result 1/" + results.length)
                    .setImage(results[0].image)
                    .setAuthor(msg.author.username, msg.author.displayAvatarURL())
                    .setDescription("Say `n` to go to the next result\n" +
                                    "Say `p` to go to the previous result\n");
                    msg.channel.send(embed)
                    .then(i_msg => {
                        msg.channel.stopTyping(true);
                        enableInt(i_msg, {
                            results: results,
                            currentRes: 0,
                            keywords: keywords
                        });
                    });
                });
            });
            req.on("error", e => {
                msg.channel.send("Failed to perform search: " + e.message);
                msg.channel.stopTyping(true);
            });
        });
    });
    req.on("error", e => {
        msg.channel.send("Failed to retrieve search token: " + e.message);
        msg.channel.stopTyping(true);
    });
}

function interactor(msg, i_msg, interact) {
    var results = interact.results;
    if (interact.currentRes == results.length - 1) {
        msg.channel.send("End of results reached.");
        return;
    }
    if (msg.content == "n" || msg.content == "next") {
        interact.currentRes += 1;
    }
    if (msg.content == "p" || msg.content == "prev") {
        if (interact.currentRes == 0) {
            msg.channel.send("You cannot go back any further.");
            return;
        }
        interact.currentRes -= 1;
    }
    var embed = new Discord.MessageEmbed()
    .setColor(3447003)
    .setTitle(`Image Search Results for '${interact.keywords}'`)
    .setFooter(`Result ${interact.currentRes + 1}/${results.length}`)
    .setImage(results[interact.currentRes].image)
    .setAuthor(msg.author.username, msg.author.displayAvatarURL())
    .setDescription("Say `n` to go to the next result\n" +
                    "Say `p` to go to the previous result\n");
    i_msg.edit(embed);
}

module.exports = {
    help: help,
    execute: execute,
    interactor: interactor,
    interactWords: ["n", "next", "p", "prev"]
}