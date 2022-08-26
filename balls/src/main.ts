import Discord from "discord.js";
import { PrefixManager, MessageHandler, CommandParser, EnvOptions } from "./core";
import Bot from "./Bot";
import nodeCleanup from "node-cleanup";
import { IPCClient } from "./ipc";

const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
//      Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
//      Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ],
    partials: ["MESSAGE", "CHANNEL"],
    makeCache: Discord.Options.cacheWithLimits({
        ...Discord.Options.defaultMakeCacheSettings,
        MessageManager: 50
    })
});

client.on("ready", () => {
    console.log(`-- Logged in: ${client.user!.tag}`);
});

client.on("messageCreate", msg => {
    MessageHandler.onMessage(msg);
});

function runInit(compName: string, func: () => boolean) {
    let success: boolean = func();
    console.log(`* ${compName} - ${success ? "OK" : "FAIL"}`);
    if (!success)
        throw `Failed to initialize ${compName}`;
}

function fatalError(msg: string) {
    console.error(msg);
    process.exit(1);
}

function pingCoreProcess(): Promise<boolean> {
    return new Promise(resolve => {
        let timeout = setTimeout(() => resolve(false), 1000);
        IPCClient.once("pong", () => {
            clearTimeout(timeout);
            resolve(true);
        });
        IPCClient.send("ping");
    })
}

async function init() {
    if (!process.send)
        fatalError("-- Node wasn't spawned with an IPC channel, can't communicate with core process!");

    if (!await pingCoreProcess())
        fatalError("-- No response from core process.");

    console.log("-- Init");
    runInit("PrefixManager", PrefixManager.init);
    runInit("CommandParser", CommandParser.init);

    console.log("-- Login");
    const token = (EnvOptions.isEnabled("TEST") && Bot.testToken.length > 0) ? Bot.testToken : Bot.token;
    client.login(token);
}

let shuttingDown = false;
nodeCleanup(() => {
    if (shuttingDown) return;
    shuttingDown = true;
    
    console.log("// Shutdown requested");

    console.log("-- Logout");
    client.destroy();

    console.log("-- We're done here. Goodbye!");
    process.exit();
});

init();