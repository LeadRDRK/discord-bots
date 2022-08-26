var help = {
    usage: "",
    desc: "Summons Talking Ben."
}

function execute(msg, _, enableInt) {
    msg.channel.send("\\*Picks up the phone\\* Ben?");
    enableInt(null, {});
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

const responses = [
    "Yes?",
    "No.",
    "Ughh",
    "Ho ho ho.",
    "\\*Hangs up the phone\\*" // ending message
];

const randArray = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4];

function interactor(msg, _, interact) {
    if (randomInt(100000) == 69420)
    {
        msg.channel.send("https://cdn.discordapp.com/attachments/771033832044101682/946676760882348052/speed.gif");
        return;
    }
    
    let index = randArray[randomInt(randArray.length)];
    if (index == responses.length - 1)
    {
        interact.end = true;
        return;
    }
    msg.channel.send(responses[index]);
}

module.exports = {
    help: help,
    execute: execute,
    interactor: interactor,
    interactWords: "*",
    liveInteract: true,
    interactTimeout: 15000,
    timeoutMsg: responses[responses.length - 1]
}
