const Discord = require("discord.js");
const client = new Discord.Client();
const glob = require("glob");
const path = require("path");
const http = require("http");
const fs = require("fs");
const ejs = require("ejs");
const psWatch = require("./psWatch");

// bot e
var testMode = process.argv[2] == "test";
var prefix = testMode ? "=" : "-";
var commands = {};

// external libraries
process.env.LD_LIBRARY_PATH += ":/app/.apt/lib/x86_64-linux-gnu";

// web
var pages = {
    ["/"]: fs.readFileSync("web/index.html"),
    ["/changelog"]: fs.readFileSync("web/changelog.html"),
};

var files = {
    ["/common.css"]: fs.readFileSync("web/common.css"),
    ["/favicon.ico"]: fs.readFileSync("web/favicon.ico"),
    ["/common.js"]: fs.readFileSync("web/common.js"),
    ["/goodbyemom.png"]: fs.readFileSync("web/goodbyemom.png"),
    ["/balls.png"]: fs.readFileSync("web/balls.png")
};

function loadCommands(cb) {
    commands = {};
    var helpContent = {};
    var t1 = new Date();
    var cmdCount = 0;
    var p = new Promise((resolve, _) => {
        let files = glob.sync("./commands/*.js");
        cmdCount = files.length;
        files.forEach((file, index) => {
            var cmdModule = require(path.resolve(file));
            var name = path.parse(file).name;
            commands[name] = cmdModule;
            if (cmdModule.help.aliases) {
                cmdModule.help.aliases.forEach(alias => {
                    commands[alias] = {};
                    commands[alias].execute = cmdModule.execute;
                });
            }
            helpContent[name] = cmdModule.help;
            if (index == files.length - 1) resolve();
        })
    });
    p.then(() => {
        var t2 = new Date();
        var timeElapsed = (t2-t1)/1000;
        console.log(`Loaded ${cmdCount} commands in ${timeElapsed} seconds.`)
        ejs.renderFile("web/commands.ejs", {helpContent: helpContent})
        .then(page => pages["/commands"] = page);
        if (cb) cb(cmdCount);
    });
}
loadCommands();

commands.help = {}
commands.help.execute = (msg) => {
    msg.channel.send(`${msg.author}: https://balls.leadrdrk.eu.org/commands`)
}

var privateCommands = {};

privateCommands.restart = (msg) => {
    msg.react("✅")
    .then(_ => {process.exit()});
}

privateCommands.reload = (msg) => {
    loadCommands(cmdCount => msg.channel.send(`Reloaded ${cmdCount} commands.`));
}

privateCommands.eval = (msg) => {
    try {
        var res = eval(msg.content.slice(6));
        if (res && typeof res == "string") msg.channel.send(res)
        else msg.channel.send("No output.");
    } catch (e) {
        msg.channel.send(e.message);
    }
}

let activities = [
    ["PLAYING", "with balls"],
    ["PLAYING", "American Dad Any% Speedrun"],
    ["WATCHING", "you"],
    ["PLAYING", "pot"],
    ["PLAYING", "society"],
    ["WATCHING", "smosh: the movie bluray HD .t0rrent free download"],
    ["WATCHING", "أوباما فيلم الجنس"],
    ["PLAYING", "con cặc"],
    ["PLAYING", "in the Obama Coin factory"],
    ["WATCHING", "the bite of 87"],
    ["WATCHING", "paint dry"],
    ["LISTENING", "fart with extra reverb"],
];

function randomActivity() {
    let activity = activities[Math.floor(Math.random()*activities.length)]
    client.user.setActivity(activity[1] + ` | ${prefix}help`, {type: activity[0]})
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    randomActivity();
    setInterval(randomActivity, 900000);
});

var authorId = "" // author's id
var interactions = {};
var rateLimited = {};

function interactionEnd(id, channel, endMsg)
{
    delete interactions[id];
    if (endMsg) channel.send(endMsg);
}

client.on("message", msg => {
    if (msg.author.bot) return;
    if (msg.mentions.has(client.user) && !msg.mentions.everyone) {
        msg.channel.send((msg.author.id == authorId
                         ? "hello lead : - )"
                         : "My prefix is `" + prefix + "`"));
        return;
    }
    var serverPrefix = prefix;
    let noInteract = false;
    if (msg.content.startsWith(serverPrefix)) {
        let args = msg.content.split(/[\n\s]+/); // matches newlines and spaces
        let cmd = args[0].substr(serverPrefix.length).toLowerCase();
        args.shift();
        if (commands[cmd]) {
            if (rateLimited[msg.channel.id]) {
                msg.channel.send(":warning: You're using commands too quickly.");
                return;
            }
            var command = commands[cmd];
            if (command.interactor) {
                command.execute(msg, args, (i_msg, interactObj) => {
                    if (interactions[msg.author.id]) {
                        clearTimeout(interactions[msg.author.id].timeout);
                    }
                    interactions[msg.author.id] = {
                        cmd: cmd,
                        i_msg: i_msg,
                        interactObj: interactObj,
                        timeout: setTimeout(() => interactionEnd(msg.author.id, msg.channel, command.timeoutMsg),
                                            command.interactTimeout ? command.interactTimeout : 90000)
                    }
                    // prevent interaction right after command
                    noInteract = true;
                }, client);
            } else {
                command.execute(msg, args, client);
            }
            rateLimited[msg.channel.id] = true;
            setTimeout(() => delete rateLimited[msg.channel.id], command.timeout ? command.timeout * 1000 : 3000);
        } else if (privateCommands[cmd] && msg.author.id == authorId) {
            privateCommands[cmd](msg, args);
        };
    };
    
    if (noInteract) return;
    if (interactions[msg.author.id]) {
        var interaction = interactions[msg.author.id];
        var cmd = commands[interaction.cmd];
        if (cmd.interactWords == "*" || cmd.interactWords.includes(msg.content)) {
            cmd.interactor(msg, interaction.i_msg, interaction.interactObj);
            
            if (!cmd.liveInteract)
            {
                if (msg.deletable) msg.delete();
                else msg.channel.send(":warning: **Warning:** Please give me the `Manage Messages` permission for this to work correctly!");
            }
            
            clearTimeout(interaction.timeout);
            if (interaction.interactObj.end)
                interactionEnd(msg.author.id, msg.channel, cmd.timeoutMsg);
            else
                interaction.timeout = setTimeout(() => interactionEnd(msg.author.id, msg.channel, cmd.timeoutMsg),
                                                 cmd.interactTimeout ? cmd.interactTimeout : 90000);
        }
    }
});

client.login(testMode ? ""   // test token
                      : ""); // real token

// web server
http.createServer((req, res) => {
    var url = new URL(req.url, `http://example.com`);
    if (pages[url.pathname]) {
        res.setHeader('Content-Type', "text/html; charset=UTF-8");
        res.writeHead(200)
           .end(pages[url.pathname]);
    } else if (files[url.pathname]) {
        res.writeHead(200)
           .end(files[url.pathname]);
    } else {
        res.writeHead(404)
           .end("404 Not Found");
    }
}).listen(process.env.PORT || 8080)

// pingy thingy
setInterval(() => {
    http.get("http://example.com")
        .on("error", () => {});
}, 300000);

// ffmpeg watcher
setInterval(psWatch, 1000);
