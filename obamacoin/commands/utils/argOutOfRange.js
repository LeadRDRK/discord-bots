module.exports = (channel, argName, val, min, max) => {
    if (val > max || val < min) {
        channel.send(`${argName} too ${val > max ? "high" : "low"}.\n` +
                    `Min ${argName.toLowerCase()}: ${min}, max ${argName.toLowerCase()}: ${max}`);
        return true;
    }
    return false;
}