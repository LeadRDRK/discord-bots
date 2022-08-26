var help = {
    usage: "",
    desc: "Tells Obama Coin to stop typing. This only serves as a temporary fix for a bug and will be removed in a future version.",
    aliases: ["stoptyping", "stfu"]
}

function execute(msg, args) {
    msg.channel.stopTyping(true);
    msg.channel.send("ok");
};

module.exports = {
    help: help,
    execute: execute
}
