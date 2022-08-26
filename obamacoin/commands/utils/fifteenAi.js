const http = require("http");
const aiUrl = "http://api.15.ai/app/getAudioFile";

module.exports = (msg, args, character, emotion) => {
    if (args.length < 1) {
        msg.channel.send("Missing arguments.");
        return;
    }
    msg.channel.startTyping();
    let text = args.join(" ").substr(0, 200);
    if (text[text.length - 1] != ".") text += ".";
    if (!text.trim().length) {
        msg.channel.send("No text provided.");
        return;
    }
    let reqBody = JSON.stringify({
        text: text,
        character: character,
        emotion: emotion ? emotion : "Contextual",
        use_diagonal: true
    });
    let req = http.request(aiUrl, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(reqBody),
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'
        }
    }, res => {
        if (res.statusCode != 200) {
            if (res.statusCode >= 500 && res.statusCode <= 599) {
                msg.channel.send("API Error " + res.statusCode + ". This is a 15.ai error; please check https://15.ai for more info (if any)");
            } else {
                msg.channel.send("Error: Unexpected server response.");
            }
            msg.channel.stopTyping(true);
            return;
        }
        var data = [];
        res.on('data', chunk => {
            data.push(chunk);
        }).on('end', () => {
            msg.channel.stopTyping(true);
            var buffer = Buffer.concat(data);
            if (buffer.byteLength >= 8000000) {
                msg.channel.send("File too large.");
                return;
            }
            msg.channel.send({
                files: [{
                    attachment: buffer,
                    name: character + ".wav"
                }]
            });
        });
    })
    req.on('error', (e) => {
        msg.channel.send("Error: " + e.message);
    });
    req.write(reqBody);
    req.end();
}
