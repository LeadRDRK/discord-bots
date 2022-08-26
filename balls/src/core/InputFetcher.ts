import axios, { AxiosError, AxiosRequestConfig, AxiosResponseHeaders } from "axios";
import axiosRetry from "axios-retry";
import fs from "node:fs";
import { ParseOptions } from "./CommandParser";
import { CommandInputs, IMAGE_URL_OPTIONS, InputFile } from ".";
import { Collection, Message } from "discord.js";
import mime from "mime-types";
import Utils from "./Utils";
import { WorkDir } from "./TaskManager";
import youtubedl, { YtResponse } from "youtube-dl-exec";
const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

axiosRetry(axios);

interface FetchData {
    msg: Message,
    messages: Message[],
    inputFormats: Set<string>,
    inputCount: number
}

function getExtension(filename: string): string | false {
    let dotPos = filename.lastIndexOf(".");
    if (dotPos != -1) {
        return filename.slice(dotPos + 1);
    }
    return false;
}

// Map certain types of extensions to their more common siblings
let extMap: {[key: string]: string} = {
    mpga: "mp3",
    qt: "mov",
    oga: "ogg"
}
function getExtensionFromHeaders(headers: AxiosResponseHeaders): string | false {
    if ("content-disposition" in headers) {
        let contentDisp = headers["content-disposition"];
        let fnPos = contentDisp.indexOf('filename="');
        if (fnPos != -1) {
            let begin = fnPos + 10;
            let end = contentDisp.indexOf('"', begin);
            if (end != -1) {
                let filename = contentDisp.slice(begin, end);
                return getExtension(filename);
            }
        }
    }

    if ("content-type" in headers) {
        let contentType = headers["content-type"];
        let sepPos = contentType.indexOf(";");
        if (sepPos == -1) sepPos = contentType.length;
        let ext = mime.extension(contentType.slice(0, sepPos));
        if (ext && ext in extMap) ext = extMap[ext];
        return ext;
    }

    return false;
}

const youtubeHosts = new Set<string>(["www.youtube.com", "youtube.com", "youtu.be"]);
const tenorHosts = new Set<string>(["www.tenor.com", "tenor.com"]);
const twitterHosts = new Set<string>(["www.twitter.com", "twitter.com"]);

async function checkFormat(url: string, inputFormats: Set<string>): Promise<boolean> {
    // 1. Infer file extension from url path (quick n' dirty)
    let urlObject = new URL(url);
    let pathname = urlObject.pathname.toLowerCase();
    if (pathname[pathname.length - 1] == "/") {
        pathname = pathname.slice(0, pathname.length - 1);
    }
    let ext = getExtension(pathname);
    if (ext && inputFormats.has(ext)) {
        return true;
    }

    // 2. Do a HEAD request and check its format
    try {
        let res = await axios.head(url, {timeout: 2000});

        let ext = getExtensionFromHeaders(res.headers);
        if (ext && inputFormats.has(ext))
            return true;
    }
    catch {
    }

    // 3. Check for special hosts
    let host = urlObject.host.toLowerCase();
    if (youtubeHosts.has(host) || (twitterHosts.has(host) && pathname.includes("/status/")))
        return inputFormats.has("mp4");

    if (tenorHosts.has(host) && pathname.startsWith("/view/"))
        return inputFormats.has("gif");

    // ¯\_(ツ)_/¯
    return false;
}

async function fetchFromUrls(msg: Message, inputFormats: Set<string>, limit?: number): Promise<Array<string>> {
    let res: string[] = [];
    let matches = msg.content.match(urlRegex);
    if (matches) {
        for (const url of matches) {
            if (await checkFormat(url, inputFormats)) {
                res.push(url);
                if (limit && res.length >= limit)
                    break;
            }
        };
    }
    return res;
}

async function fetchFromAttachments(msg: Message, inputFormats: Set<string>, limit?: number): Promise<Array<string>> {
    let res: string[] = [];
    for (const [_, attach] of msg.attachments) {
        if (attach.contentType) {
            if (await checkFormat(attach.url, inputFormats)) {
                res.push(attach.url);
                if (limit && res.length >= limit)
                    break;
            }
        }
    }
    return res;
}

async function fetchFromMessage(msg: Message, inputFormats: Set<string>, limit: number): Promise<Array<string>> {
    let res1 = await fetchFromAttachments(msg, inputFormats, limit);
    if (res1.length >= limit) return res1;
    let res2 = await fetchFromUrls(msg, inputFormats, limit - res1.length);
    return [...res1, ...res2];
}

async function fetchFromMessages(data: FetchData, inputs: CommandInputs) {
    for (const msg of data.messages) {
        let res = await fetchFromMessage(msg, data.inputFormats, data.inputCount - inputs.length);
        for (const url of res) {
            inputs.push(new InputFile(url));
        }
        if (inputs.length >= data.inputCount)
            break;
    }
}

async function lastFetchersBase(data: FetchData, arg: string | undefined, msgFetchFunc: Function): Promise<string> {
    let num = 0;
    if (arg) {
        num = Number(arg);
        if (isNaN(num)) throw `Ill-formed number: ${arg}`;
    }

    for (const msg of data.messages) {
        let res = await msgFetchFunc(msg, data.inputFormats);
        if (res.length <= num)
            num -= res.length;
        else {
            // Invert index (last is first)
            let index = (res.length - 1) - num;
            return res[index];
        }
    };

    return "";
}

async function assetFetcherBase(data: FetchData, path: string): Promise<string> {
    let ext = Utils.getExtension(path);
    if (data.inputFormats.has(ext))
        return "asset://" + path;
    else
        return "";
}

const fetchers: {[key: string]: (data: FetchData, arg?: string) => Promise<string>} = {
    async lasturl(data: FetchData, arg?: string): Promise<string> {
        return await lastFetchersBase(data, arg, fetchFromUrls);
    },

    async lastattach(data: FetchData, arg?: string): Promise<string> {
        return await lastFetchersBase(data, arg, fetchFromAttachments);
    },

    async msg(data: FetchData, id?: string): Promise<string> {
        if (!id) {
            throw "No message ID was provided";
        }
        if (Utils.isMessageLink(id))
            id = Utils.getMessageIdFromLink(id);

        try {
            let message = await data.msg.channel.messages.fetch(id);
            let arr = await fetchFromMessage(message, data.inputFormats, 1);
            if (arr.length > 0)
                return arr[0];
            else
                return "";
        }
        catch {
            throw "Failed to fetch from message";
        }
    },

    async avatar(data: FetchData, id?: string): Promise<string> {
        if (!id) {
            throw "No user ID was provided";
        }
        let user = await Utils.getArgUser(data.msg.client, id);
        let url = user.avatarURL(IMAGE_URL_OPTIONS);
        if (url && await checkFormat(url, data.inputFormats)) {
            return url;
        }
        else return "";
    },

    async vineboom(data: FetchData): Promise<string> {
        return await assetFetcherBase(data, "audio/vineboom.wav");
    },

    async ohmygod(data: FetchData): Promise<string> {
        return await assetFetcherBase(data, "audio/ohmygod.wav");
    },

    async ohmygah(data: FetchData): Promise<string> {
        return await assetFetcherBase(data, "audio/ohmygah.wav");
    },

    async fnaf2amb(data: FetchData): Promise<string> {
        return await assetFetcherBase(data, "audio/fnaf2amb.wav");
    }
}
// Aliases
fetchers.pfp = fetchers.avatar;

async function fetchFromInputSpecifiers(data: FetchData, inputSpecifiers: string[], inputs: CommandInputs) {
    for (const str of inputSpecifiers) {
        let url: string;
        if (str.startsWith("::")) {
            let value = str.slice(2);
            let [ name, arg ] = value.split(":");

            let fetcher = fetchers[name];
            if (!fetcher) {
                throw `Invalid fetcher name: ${name}`;
            }
            try {
                url = await fetcher(data, arg);
                if (url.length == 0) {
                    throw `Failed to get input using fetcher: ${name}`;
                }
            } catch (error) {
                throw `${error} (in ${str})`;
            }
        }
        else if (str.startsWith("http")) {
            url = str;
            if (!(await checkFormat(url, data.inputFormats))) {
                throw `Unsupported file: <${url}>`
            }
        }

        inputs.push(new InputFile(url!));
        if (inputs.length >= data.inputCount)
            return;
    }
}

let prefetchedChannels = new Set<string>();
let ongoingFetches: {[key: string]: Promise<Collection<string, Message>>} = {};
async function fetchInputFiles(msg: Message, inputSpecifiers: string[], inputs: CommandInputs, options: ParseOptions) {
    if (!options.inputCount || !options.inputFormats) return;

    // 1. Fetch from replied message
    if (msg.type == "REPLY" && msg.reference?.messageId) {
        let messageId = msg.reference.messageId;
        // Check if message exists in cache, else fetch it
        try {
            let repliedMsg: Message;
            if (msg.channel.messages.cache.has(messageId))
                repliedMsg = msg.channel.messages.cache.get(messageId)!;
            else
                repliedMsg = await msg.channel.messages.fetch(messageId);
            
            let res = await fetchFromMessage(repliedMsg, options.inputFormats, options.inputCount);
            for (const url of res) {
                inputs.push(new InputFile(url));
            }
            if (inputs.length >= options.inputCount)
                return;
        }
        catch {
        }
    }

    let fetchData: FetchData;
    try {
        // Prefetch up to 50 previous messages
        let messages: Message[];
        if (msg.channelId in ongoingFetches) {
            messages = (await ongoingFetches[msg.channelId]).last(50);
        }
        else if (msg.channel.messages.cache.size >= 50 || prefetchedChannels.has(msg.channelId)) {
            messages = msg.channel.messages.cache.last(51).reverse();
            // Pop current message
            messages.shift();
        }
        else {
            let promise = msg.channel.messages.fetch({limit: 50, before: msg.id});
            // Allow other operations to wait for the same promise at the same time
            ongoingFetches[msg.channelId] = promise;
            messages = (await promise).last(50);
            // Prevent a race condition(?) in which the cache hasn't caught up with the messages
            setTimeout(() => delete ongoingFetches[msg.channelId], 1000);
            prefetchedChannels.add(msg.channelId);
        }
        fetchData = {
            msg,
            messages,
            inputFormats: options.inputFormats,
            inputCount: options.inputCount
        }
    }
    catch {
        if (msg.channel.type == "GUILD_TEXT") {
            let permissions = msg.channel.permissionsFor(msg.client.user!);
            if (permissions && !permissions.has("READ_MESSAGE_HISTORY")) {
                throw "Failed to get previous messages (missing Read Message History permission)";
            }
        }
        throw "Failed to get previous messages. Please try again.";
    }
    
    // 2. Check input specifiers/urls
    await fetchFromInputSpecifiers(fetchData, inputSpecifiers, inputs);
    if (inputs.length >= options.inputCount)
        return;

    // 3. Check for current message's attachments (urls are already checked as an input specifier)
    let res = await fetchFromAttachments(msg, options.inputFormats, options.inputCount - inputs.length);
    for (const url of res) {
        inputs.push(new InputFile(url));
    }

    if (inputs.length >= options.inputCount)
        return;
    
    // 4. Check for previous messages
    await fetchFromMessages(fetchData, inputs);

    if (inputs.length < options.inputCount)
        throw msg.reply(`Insufficient input files count (expected ${options.inputCount}, got ${inputs.length})`);
}

const sizeLimit = 20971520;
const sizeLimitError = "File exceeded 20MiB size limit.";
function pipeResponseToFile(data: NodeJS.ReadStream, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let size = 0;
        let rejected = false;
        data.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > sizeLimit) {
                rejected = true;
                data.destroy();
                reject(sizeLimitError);
            }
        })
        .on("close", () => {
            if (!rejected) resolve();
        })
        .pipe(fs.createWriteStream(filename));
    });
}

async function getYoutubeDlLink(url: string, host: string): Promise<string> {
    let res: YtResponse;
    try {
        res = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            callHome: false,
            noCheckCertificate: true,
            noPlaylist: true,
            playlistEnd: 1,
            flatPlaylist: true,
            socketTimeout: 10,
            youtubeSkipDashManifest: true
        });
    }
    catch {
        throw `Failed to get media link for "${host}"`;
    }

    if (youtubeHosts.has(host)) {
        for (const format of res.formats) {
            const id = format.format_id;
            if (id == "18" || id == "22")
                return format.url;
        }
    }

    if (twitterHosts.has(host)) {
        for (const format of res.formats) {
            const id = format.format_id;
            if (id == res.format_id && !id.startsWith("hls"))
                return format.url;
        }
    }

    throw `Failed to get media link for "${host}"`;
}

const dlRequestConfig: AxiosRequestConfig = {
    responseType: "stream",
    timeout: 3000,
}
const unknownErrorStr = "Unknown error while trying to download input files.";
async function downloadInputFiles(inputs: CommandInputs, workDir: WorkDir) {
    let i = 0;
    for (const input of inputs) {
        try {
            let url = input.url;
            let urlObj = new URL(url);
            if (urlObj.protocol == "asset:") {
                input.path = "./assets/" + url.slice(8);
                continue;
            }

            let host = urlObj.host.toLowerCase();
            if (youtubeHosts.has(host) || twitterHosts.has(host))
                url = await getYoutubeDlLink(url, host);
            else if (tenorHosts.has(host))
                url += ".gif";

            let res = await axios.get(url, dlRequestConfig);
            if ("content-length" in res.headers) {
                if (Number(res.headers["content-length"]) > sizeLimit)
                    throw sizeLimitError;
            }

            let ext = getExtensionFromHeaders(res.headers);
            if (!ext) {
                ext = getExtension(input.url);
                if (!ext) throw unknownErrorStr;
            }
            input.path = `${workDir.path}/${i}.${ext}`;
            await pipeResponseToFile(res.data, input.path);
        }
        catch (error) {
            if (error instanceof AxiosError) {
                if (error.response) {
                    throw `Failed to download input file: <${error.config.url}>`;
                }
                else if (error.request) {
                    throw `Failed to receive response from server: <${error.config.url}>`;
                }
                else {
                    console.log("WARNING: Unknown download error: " + error.message);
                    throw unknownErrorStr;
                }
            }
            else if (typeof error == "string")
                throw error;
            else {
                console.log("WARNING: Unknown download error");
                console.log(error);
                throw unknownErrorStr;
            }
        }
        ++i;
    }
}

const InputFetcher = {
    fetchInputFiles,
    downloadInputFiles,
    getYoutubeDlLink
};
export { InputFetcher }
