import { BufferResolvable, Client, Guild,  Message, User } from "discord.js";
import { CommandInputs, InputFetcher, IMAGE_URL_OPTIONS, SIMG_URL_OPTIONS, PIXELS_LIMIT, CommandArgs, PIXELS_LIMIT_MAX } from ".";
import { FFmpeg, FFmpegArgs, getInputType, InputType, MediaInfo } from "../media";
import { TaskManager, WorkDir } from "./TaskManager";
import { promises as fs, Stats, createReadStream } from "node:fs";
import FormData from "form-data";
import axios from "axios";

function isMessageLink(url: string): boolean {
    return url.match(/^https?:\/\/discord\.com\/channels\/[0-9]+\/[0-9]+\/[0-9]+\/?/) != null;
}

function getMessageIdFromLink(url: string): string {
    return url.slice(url.lastIndexOf("/") + 1);
}

function isUserMention(str: string): boolean {
    return str.match(/<@[0-9]+>/) != null;
}

function getUserIdFromMention(mention: string): string {
    return mention.slice(2, mention.length - 1);
}

function createMessageSubset(msg: Message) {
    return {
        content: msg.content,
        id: msg.id,
        guildId: msg.guildId,
        channelId: msg.channelId,
        author: {
            avatar: msg.author.avatarURL(IMAGE_URL_OPTIONS),
            id: msg.author.id,
            username: msg.author.username,
            discriminator: msg.author.discriminator,
            tag: msg.author.tag
        },
        guild: {
            name: msg.guild?.name,
            id: msg.guild?.id,
            icon: msg.guild?.iconURL(IMAGE_URL_OPTIONS),
            banner: msg.guild?.bannerURL(SIMG_URL_OPTIONS)
        },
        channel: {
            name: msg.channel.type == "GUILD_TEXT" ? msg.channel.name : undefined,
            id: msg.channel.id
        }
    }
}

function getExtension(filename: string): string {
    let dotPos = filename.lastIndexOf(".");
    return (dotPos != -1) ? filename.slice(dotPos + 1) : "";
}

function getFilename(path: string): string {
    let slashPos = path.lastIndexOf("/");
    return (slashPos != -1) ? path.slice(slashPos + 1) : path;
}

function getBasename(path: string): string {
    let filename = getFilename(path);
    let dotPos = filename.lastIndexOf(".");
    return (dotPos != -1) ? filename.slice(0, dotPos) : filename;
}

function getOutputFormatFromExt(format: string): string {
    let inputType = getInputType(format);
    // MP4 and MOV are allowed to keep their format since they support h264
    // MKV can't be played in Discord so leaving that one out for now...
    if (inputType == InputType.VIDEO && format != "mov") {
        return "mp4";
    }
    else
        return format;
}

function getOutputFormat(filename: string): string {
    return getOutputFormatFromExt(getExtension(filename));
}

function isTimestampStr(duration: string): boolean {
    return duration.match(/^-?[0-9][0-9]?:[0-9][0-9]?:[0-9][0-9]?(\.[0-9][0-9]?)?$/) != null;
}

function parseTimestampStr(duration: string): number {
    let split = duration.split(":");
    let time = (+split[0] * 3600) + (+split[1] * 60) + (+split[2]);
    if (duration.startsWith("-")) time = -time;
    return time;
}

function mibToBytes(mib: number): number {
    return mib * (1<<20);
}

const t3SizeLimit      = mibToBytes(100);
const t2SizeLimit      = mibToBytes(50);
const defaultSizeLimit = mibToBytes(8);

function getFileSizeLimit(guild: Guild): number {
    switch (guild.premiumTier) {
        case "TIER_3": return t3SizeLimit;
        case "TIER_2": return t2SizeLimit;
        default      : return defaultSizeLimit;
    }
}

async function uploadToCatbox(file: BufferResolvable): Promise<string | false> {
    let data = new FormData();
    data.append("reqtype", "fileupload");
    data.append("fileToUpload", createReadStream(file));

    try {
        const res = await axios.post("https://catbox.moe/user/api.php", data, {
            headers: data.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });
        return res.data;
    }
    catch (error) {
        console.log(error);
        return false;
    }
}

async function replyFile(msg: Message, file: BufferResolvable): Promise<void> {
    // Check permissions
    if (msg.channel.type != "DM" && msg.guild && msg.guild.me) {
        let perms = msg.channel.permissionsFor(msg.guild.me);
        if (!perms.has("ATTACH_FILES")) {
            msg.reply("I don't have permission to send files in this channel.");
            return;
        }
    }

    // Check file size
    let stats: Stats;
    try {
        stats = await fs.stat(file);
    }
    catch {
        msg.reply("Internal error occurred.");
        console.log("ERROR: Attempted to send file that doesn't exist");
        return;
    }

    // Upload to catbox if it's too large
    let sizeLimit = msg.guild ? getFileSizeLimit(msg.guild) : defaultSizeLimit;
    if (stats.size > sizeLimit) {
        msg.reply("File too large, uploading to catbox.moe...");
        msg.channel.sendTyping();
        const res = await uploadToCatbox(file);
        msg.reply(res ? res : "Failed to upload to catbox.moe");
        return;
    }

    // Upload normally
    await msg.reply({
        files: [{ attachment: file }]
    });
}

type ArgsRet = FFmpegArgs | FFmpegArgs[];
type ArgsGenFunc = (workDir: WorkDir, medias: MediaInfo[]) => ArgsRet | Promise<ArgsRet>;
type ArgsGenFunc2 = (workDir: WorkDir) => ArgsRet | Promise<ArgsRet>;
async function createProcessMediaTask(inputs: CommandInputs, msg: Message, argsGen: ArgsGenFunc): Promise<WorkDir>;
async function createProcessMediaTask(inputs: undefined, msg: Message, argsGen: ArgsGenFunc2): Promise<WorkDir>;
async function createProcessMediaTask(inputs: CommandInputs | undefined, msg: Message, argsGen: Function): Promise<WorkDir> {
    let taskId = TaskManager.generateTaskId();
    let workDir = await TaskManager.createWorkDir(taskId);
    await new Promise<void>(resolve => {
        TaskManager.createTask(taskId, msg.author.id, async (rejected): Promise<void> => {
            try {
                if (rejected) throw "You've reached the limit for the number of queued tasks. Please try again later.";
                let mediaInfo: MediaInfo[] = [];
                let argsArr: ArgsRet;
                if (inputs) {
                    await InputFetcher.downloadInputFiles(inputs, workDir);
                    mediaInfo = await FFmpeg.getMediaInfo(inputs);
                    argsArr = await Promise.resolve(argsGen(workDir, mediaInfo));
                }
                else {
                    argsArr = await Promise.resolve(argsGen(workDir));
                }
                if (!Array.isArray(argsArr)) argsArr = [argsArr];

                for (const args of argsArr) {
                    await FFmpeg.processMedia(mediaInfo, args);
                }

                let lastArgs = argsArr[argsArr.length - 1];
                let outputFile = lastArgs.getOutputPath();
                await replyFile(msg, outputFile);
            }
            catch (error) {
                if (typeof error == "string")
                    msg.reply(error);
                else {
                    msg.reply("Internal error occurred while processing media.");
                    console.log(error);
                }
            }
            finally {
                resolve();
            }
        })
    });

    return workDir;
}

function getHighestRes(aspectRatio: number, pixelsLimit?: number, makeDivBy2?: boolean): [number, number] {
    if (!pixelsLimit) pixelsLimit = PIXELS_LIMIT;
    let nWidth = Math.sqrt(pixelsLimit * aspectRatio);
    let nHeight = Math.floor(nWidth / aspectRatio);
    // floor() later to preserve accuracy
    nWidth = Math.floor(nWidth);

    if (makeDivBy2) {
        if (nWidth % 2 != 0) ++nWidth;
        if (nHeight % 2 != 0) ++nHeight;
    }

    return [nWidth, nHeight];
}

function getAudioVideoMedias(medias: MediaInfo[]): [MediaInfo, MediaInfo] {
    let audio: MediaInfo | undefined,
        video: MediaInfo | undefined;

    // Prefer the audio stream for the first media
    if (medias[0].audio)
        audio = medias[0];
    else if (medias[0].video)
        video = medias[0];

    // Prefer the video stream for the second media
    if (medias[1].video && !video)
        video = medias[1];
    else if (medias[1].audio && !audio)
        audio = medias[1];
    
    if (!audio || !video) {
        throw "Unable to determine audio/video streams.";
    }

    return [audio, video];
}

function checkStartDuration(start: number, duration: number, srcDuration: number): [number, number] {
    // Negative timestamps
    if (start < 0 && srcDuration)
        start += srcDuration;

    if (duration < 0) {
        start += duration;
        duration = -duration;
    }
    else if (duration == 0 && srcDuration) {
        duration = srcDuration - start;
    }
    else if (isNaN(srcDuration)) {
        duration = 1;
    }

    // Boundary check
    if (start < 0 || start > srcDuration)
        throw "Start time out of range.";

    if (duration <= 0 || start + duration > srcDuration)
        throw "Duration out of range.";
    
    return [start, duration];
}

function getArgUrl(arg: string): string {
    if (arg.startsWith("<http") && arg.endsWith(">")) {
        arg = arg.slice(1, -1);
    }
    return arg;
}

async function getArgUser(client: Client, arg: string): Promise<User> {
    if (isUserMention(arg))
        arg = getUserIdFromMention(arg);
    
    try {
        let user = await client.users.fetch(arg);
        return user;
    }
    catch {
        throw "Failed to fetch user.";
    }
}

function colorCompHex(c: number): string {
    return c.toString(16).padStart(2, "0");
}

function parseColorArgs(args: CommandArgs, i: number): string {
    let color = "0x000000ff";
    if (args.has(i)) {
        let str = args.getString(i).toLowerCase();
        let num = args.checkInteger(i); // Check if its a number first even if we don't use it
        if (str.startsWith("0x") && !args.has(i + 1)) {
            if (str.length < 8) throw "Invalid hex color value.";
            color = str.padEnd(10, "ff");
        }
        else {
            let r = num;
            let g = 0, b = 0, a = 255;
            if (args.has(i + 1)) g = args.checkInteger(i + 1);
            if (args.has(i + 2)) b = args.checkInteger(i + 2);
            if (args.has(i + 3)) a = args.checkInteger(i + 3);
            color = `0x${colorCompHex(r)}${colorCompHex(g)}${colorCompHex(b)}${colorCompHex(a)}`;
        }
    }
    return color;
}

function isVideo(media: MediaInfo): boolean {
    return media.video! && !isNaN(media.duration) && media.video.codec != "gif";
}

function checkRes(media: MediaInfo, width: number, height: number) {
    let pixelsCount = width * height;
    if ((!isNaN(media.duration) && pixelsCount > PIXELS_LIMIT) || pixelsCount > PIXELS_LIMIT_MAX)
        throw "Size exceeded resolution limit."
}

function subTextToUpperCase(str: string): string {
    return str.replace(/[a-zA-Z]+(?![^{]*\})/g, s => s.toUpperCase());
}

const Utils = {
    isMessageLink,
    getMessageIdFromLink,
    isUserMention,
    getUserIdFromMention,
    createMessageSubset,
    getExtension,
    getFilename,
    getBasename,
    getOutputFormatFromExt,
    getOutputFormat,
    isTimestampStr,
    parseTimestampStr,
    createProcessMediaTask,
    getHighestRes,
    mibToBytes,
    getFileSizeLimit,
    replyFile,
    getAudioVideoMedias,
    checkStartDuration,
    getArgUrl,
    getArgUser,
    parseColorArgs,
    isVideo,
    checkRes,
    subTextToUpperCase
}
export default Utils;