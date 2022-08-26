const snoowrap = require("snoowrap");
const r = new snoowrap({
    userAgent: 'Mozilla/5.0 (compatible; Linux x86_64)',
    clientId: '',
    clientSecret: '',
    refreshToken: ''
});
const ytdl = require("youtube-dl");
const ffmpeg = require("ffmpeg-static");
const uuidv4 = require("uuid").v4;
const fs = require("fs");
var hotPostsCache = {};

function pickRandomPost(listing) {
    const post = listing[Math.floor(Math.random() * listing.length)];
    if ((!post.media && !post.url) || post.is_self) return pickRandomPost(listing);
    return post;
}

function cacheHotPosts(listing, sub) {
    hotPostsCache[sub] = listing;
    setTimeout(() => delete hotPostsCache[sub], 3600000)
}

function manualRandomPicker(sub, cb) {
    if (hotPostsCache[sub]) {
        cb(pickRandomPost(hotPostsCache[sub]));
    } else {
        r.getHot(sub, {limit: 100}).then(listing => {
            cb(pickRandomPost(listing));
            cacheHotPosts(listing, sub);
        });
    };
}

function sendPost(msg, post, resolve, reject) {
    if ((!post.media && !post.url) || post.is_self) reject();
    if (post.is_video && post.media) {
        var tmpFile = uuidv4() + ".mp4";
        ytdl.exec(post.media.reddit_video.dash_url, ["-o", tmpFile, "--ffmpeg-location", ffmpeg], {}, (err) => {
            if (err) {
                msg.channel.send("An internal error occured.\n" + 
                                 "Error code: " + err.code);
                return;
            }
            msg.channel.send({
                files: [{
                    attachment: tmpFile,
                    name: post.id + ".mp4"
                }],
                content: `Source: <https://reddit.com${post.permalink}>`
            }).then(() => {
                fs.unlink(tmpFile, () => {});
                resolve();
            }).catch(() => reject());
            // TODO: check error type
        });
    } else if (post.url) {
        // using whitelist for now
        if (post.url.endsWith("png") || post.url.endsWith("jpg") || post.url.endsWith("jpeg")) {
            msg.channel.send({
                files: [{
                    attachment: encodeURI(post.url)
                }],
                content: `Source: <https://reddit.com${post.permalink}>`
            }).then(() => {resolve()
            }).catch(() => reject());
        } else {
            reject();
        }
    } else {
        // weird thing happened ?
        reject();
    }
}

function randomReddit(sub, msg, noRandom) {
    msg.channel.startTyping();
    new Promise((resolve, reject) => {
        if (noRandom) {
            manualRandomPicker(sub, post => {
                sendPost(msg, post, resolve, reject);
            });
        } else {
            r.getRandomSubmission(sub).then(post => {
                if (post[0]) {
                    msg.channel.send("WARNING: Subreddit has random disabled but ran with noRandom=false");
                    manualRandomPicker(sub, post => {
                        sendPost(msg, post, resolve, reject);
                    });
                } else {
                    sendPost(msg, post, resolve, reject);
                }
            })
        }
    }).then(() => msg.channel.stopTyping(true), () => randomReddit(sub, msg, noRandom));
    // if reject => call function again
}

module.exports = randomReddit;