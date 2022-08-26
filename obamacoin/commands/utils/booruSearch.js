const Discord = require("discord.js");
const Booru = require("booru");

var ratings = ["safe", "s", "questionable", "q", "explicit", "e"];

var booruSearch = {};
booruSearch.execute = (site, msg, args, enableInt) => {
    if (!msg.channel.nsfw) {
        msg.channel.send(":warning: This command can only be used in NSFW channels.");
        return;
    }
    msg.channel.startTyping();
    var rating;
    if (args[0] && ratings.includes(args[0].toLowerCase())) {
        rating = args[0].toLowerCase()[0];
        args.shift();
    }
    var tags = args.join(" ");

    Booru.search(site.toLowerCase(), tags, {limit: 100})
    .then(results => {
        if (rating) results = results.filter(post => post.rating == rating);
        if (results.length == 0) {
            msg.channel.send("No results found.");
            msg.channel.stopTyping(true);
            return;
        }
        var post = results[0];
        var embed = new Discord.MessageEmbed()
        .setColor(3447003)
        .setTitle(`${site} Search Results for '${tags}'`)
        .setFooter("Result 1/" + results.length)
        .setImage(post.fileUrl)
        .setAuthor(msg.author.username, msg.author.displayAvatarURL())
        .setDescription("Say `n` to go to the next result\n" +
                        "Say `p` to go to the previous result\n" +
                        "\n" +
                        `Score: ${isNaN(post.score) ? 0 : post.score}\n` +
                        `Source: ${post.postView}`);
        msg.channel.send(embed)
        .then(i_msg => {
            msg.channel.stopTyping(true);
            enableInt(i_msg, {
                results: results,
                currentRes: 0,
                tags: tags
            });
        });
    })
    .catch(err => {
        msg.channel.send("Error: " + err);
        msg.channel.stopTyping(true);
    });
}

booruSearch.interactor = (site, msg, i_msg, interact) => {
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
    var post = results[interact.currentRes];
    var embed = new Discord.MessageEmbed()
    .setColor(3447003)
    .setTitle(`${site} Search Results for '${interact.tags}'`)
    .setFooter(`Result ${interact.currentRes + 1}/${results.length}`)
    .setImage(post.fileUrl)
    .setAuthor(msg.author.username, msg.author.displayAvatarURL())
    .setDescription("Say `n` to go to the next result\n" +
                    "Say `p` to go to the previous result\n" +
                    "\n" +
                    `Score: ${post.score}\n` +
                    `Source: ${post.postView}`);
    i_msg.edit(embed);
}
booruSearch.interactWords = ["n", "next", "p", "prev"];

module.exports = booruSearch;