const ffmpegExe: string = require("ffmpeg-static");
import { PIXELS_LIMIT, execFile, InputFile, PIXELS_LIMIT_MAX } from "../core";
import Utils from "../core/Utils";
import { getInputType, InputType } from "./InputType";

const TIMEOUT = 15000;

function exec(args: string[] | FFmpegArgs): Promise<string> {
    return new Promise((resolve, reject) => {
        let printLogs: boolean | undefined;
        if (args instanceof FFmpegArgs) {
            printLogs = args.printLogs;
            args = args.serialize();
        }
        execFile(ffmpegExe, args, {timeout: TIMEOUT}, (err, _, stderr) => {
            if (err && !stderr.includes("At least one output file must be specified")) {
                if (err.signal == "SIGTERM")
                    reject("Media took too long to process, job cancelled.");
                else if (err.signal == "SIGKILL")
                    reject("Cancelled due to heavy resource usage. Please try another file.");
                else
                    reject(`Internal error during processing.`);

                console.log(err);
                return;
            }
            if (printLogs) console.log(stderr);
            // @ts-ignore
            resolve(stderr);
        })
    })
}

function parseVideoStream(content: string, i: number, entry: MediaInfo): number {
    let start = content.indexOf("Video: ", i);
    if (start == -1) return i;
    i = start + 7;

    let codec = content.slice(i, content.indexOf(",", i));

    // Everything is parsed in reverse from here
    let tmp = i;
    i = content.indexOf(" kb/s", i);
    let bitrate: number;
    if (i == -1) {
        // Reverse search
        let tmp2 = tmp;
        tmp = content.indexOf(" fps", tmp);
        // Look for tbr instead of fps if it's not available
        if (tmp == -1) tmp = content.indexOf(" tbr", tmp2);
        tmp = content.lastIndexOf(", ", tmp);
        bitrate = NaN;
    }
    else {
        tmp = content.lastIndexOf(", ", i);
        bitrate = +content.slice(tmp + 2, i);
    }

    i = tmp;
    let tmp2 = content.lastIndexOf(" [SAR", i);
    if (tmp2 == -1) tmp2 = content.lastIndexOf(", SAR", i);
    if (tmp2 != -1 && tmp2 > start) i = tmp2;
    tmp = content.lastIndexOf(", ", i - 1);
    let res = content.slice(tmp + 2, i).split("x");
    let width = +res[0];
    let height = +res[1];

    i = content.indexOf(" fps");
    tmp = content.lastIndexOf(", ", i);
    let fps = +content.slice(tmp + 2, i);

    entry.video = { width, height, bitrate, fps, codec };
    return i;
}

function parseAudioStream(content: string, i: number, entry: MediaInfo): number {
    let start = content.indexOf("Audio: ", i);
    if (start == -1) return i;
    i = start + 7;
    let end = content.indexOf("Stream #", i);
    if (end == -1) {
        end = content.indexOf("Input #", i);
        if (end == -1)
            end = content.length;
    }

    let codec = content.slice(i, content.indexOf(",", i));

    i = content.indexOf(" Hz", i);
    let tmp = content.lastIndexOf(", ", i);
    let sampleRate = +content.slice(tmp + 2, i);

    i += 5;
    let channels = content.slice(i, content.indexOf(",", i));

    i = content.indexOf(" kb/s", i);
    let bitrate: number
    if (i != -1 && i < end) {
        tmp = content.lastIndexOf(", ", i);
        bitrate = +content.slice(tmp + 2, i);
    }
    else if (!entry.video) {
        // bitrate of entire file = bitrate of audio
        bitrate = entry.bitrate;
    }
    else bitrate = NaN;

    i = end;
    entry.audio = { sampleRate, bitrate, channels, codec };
    return i;
}

function parseMediaInfo(stderr: string): Array<MediaInfo> {
    let res: MediaInfo[] = [];
    let start = 0;
    for (;;) {
        start = stderr.indexOf("Input #", start);
        if (start == -1) break;
        start += 8;

        let end = stderr.indexOf("Input #", start) - 1;
        if (end == -2) end = stderr.length;
        let content = stderr.slice(start, end);

        let i = content.indexOf("from '") + 6;
        let path = content.slice(i, content.indexOf("'", i));

        i = content.indexOf("Duration: ", i) + 10;
        let duration: number;
        if (content.slice(i, i + 3) == "N/A" || path.endsWith(".jpeg"))
            duration = NaN;
        else
            duration = Utils.parseTimestampStr(content.slice(i, content.indexOf(",", i)));

        i = content.indexOf("bitrate: ", i) + 9;
        let bitrate: number;
        if (content.slice(i, i + 3) == "N/A")
            bitrate = NaN;
        else
            bitrate = +content.slice(i, content.indexOf(" kb/s", i));

        let selfEncoded = content.match(/(encoder|handler_name) *: *balls/i) != null;
        let entry: MediaInfo = { path, duration, bitrate, selfEncoded };

        parseVideoStream(content, i, entry);
        parseAudioStream(content, i, entry);

        res.push(entry);
        start = end;
    }
    return res;
}

let queryCache: {[key: string]: Array<MediaInfo>} = {};
let queryCacheTimeouts: {[key: string]: NodeJS.Timeout} = {};
const CACHE_TIME = 300000;

function renewCacheTimeout(cacheKey: string) {
    if (cacheKey in queryCacheTimeouts)
        clearTimeout(queryCacheTimeouts[cacheKey]);
    
    queryCacheTimeouts[cacheKey] = setTimeout(() => {
        delete queryCache[cacheKey];
        delete queryCacheTimeouts[cacheKey];
    }, CACHE_TIME);
}

async function getMediaInfo(files: InputFile[], cacheKey?: string): Promise<Array<MediaInfo>> {
    let args: string[] = [];
    for (const file of files) {
        if (!file.path) throw "File has no path";
        args.push("-i", file.path);
    }
    args.push("-hide_banner", "-nostats");

    let stderr = await exec(args);
    let res = parseMediaInfo(stderr);

    if (cacheKey) {
        queryCache[cacheKey] = res;
        renewCacheTimeout(cacheKey);
    }
    return res;
}

function getCachedMediaInfo(cacheKey: string): Array<MediaInfo> | undefined {
    if (cacheKey in queryCache) {
        renewCacheTimeout(cacheKey);
        return queryCache[cacheKey];
    }
}

export interface MediaInfo {
    path: string,

    video?: {
        width: number;
        height: number;
        bitrate: number;
        fps: number;
        codec: string;
    }

    audio?: {
        sampleRate: number;
        bitrate: number;
        channels: string;
        codec: string;
    }

    bitrate: number,
    duration: number;
    selfEncoded: boolean
};

//// Args builder classes

export interface FFmpegTime {
    start?: number;
    duration?: number;
}

export interface FFmpegInput extends FFmpegTime {
    path: string | FFmpegFilter;
    loop?: number;
    streamLoop?: number;
    type?: "lavfi";
}

export interface FFmpegFilter {
    inputs?: string[];
    name: string;
    options?: {[key: string]: string};
    outputs?: string[];
    continuous?: boolean;
}

function filterToString(filter: FFmpegFilter): string {
    let str = "";

    if (filter.inputs) {
        for (const input of filter.inputs) {
            str += `[${input}]`;
        }
    }

    str += `${filter.name}`;
    if (filter.options) {
        str += "=";
        for (const opt in filter.options) {
            str += `${opt}=${filter.options[opt]}:`;
        }
    }

    if (filter.outputs) {
        for (const output of filter.outputs) {
            str += `[${output}]`;
        }
    }

    return str;
}

export class FFmpegFilterGraph {
    filters: FFmpegFilter[] = [];

    constructor(filters?: FFmpegFilter[]) {
        if (filters) this.filters = filters;
    }

    toString(): string {
        let str = "";
        let i = 0;
        for (const filter of this.filters) {
            str += filterToString(filter);
            ++i;
            if (i < this.filters.length) str += filter.continuous ? "," : ";";
        }
        return str;
    }
}

export interface FFmpegOutput extends FFmpegTime {
    directory: string;
    format: string;
    name?: string;
    loop?: number;
    shortest?: boolean;
    streams?: string[];
    frames?: number;
}

function serializeTime(time: FFmpegTime): string[] {
    let arr: string[] = [];
    if (time.start) {
        arr.push("-ss", time.start.toString());
    }
    if (time.duration) {
        arr.push("-t", time.duration.toString());
    }
    return arr;
}

const h264Formats = new Set<string>(["mp4", "mov"]);
export class FFmpegArgs {
    inputs: FFmpegInput[] = [];
    filterGraph?: FFmpegFilterGraph;
    copyVideo?: boolean;
    copyAudio?: boolean;
    tune?: "film" | "animation" | "grain" | "stillimage";
    qp?: number;
    pixFmt?: "yuv420p" | "rgba";
    output: FFmpegOutput = { directory: "/tmp", format: "mp4" };

    // used by preprocessor
    noScaling?: boolean;

    // processMedia will call exec directly if this value is set
    rawExec?: boolean;

    // For debugging
    printLogs?: boolean;

    constructor(inputs?: FFmpegInput[], copyVideo?: boolean, copyAudio?: boolean) {
        if (inputs) this.inputs = inputs;
        this.copyVideo = copyVideo;
        this.copyAudio = copyAudio;
    }

    serialize(): string[] {
        let arr: string[] = [];
        let copyVideo = this.copyVideo;
        let copyAudio = this.copyAudio;

        // Warn of /tmp usage
        if (this.output.directory == "/tmp")
            console.log("-- WARNING: Output file will be written to /tmp");

        arr.push("-hide_banner", "-nostats", "-y");

        for (const input of this.inputs) {
            arr.push(...serializeTime(input));
            if (input.loop) arr.push("-loop", input.loop.toString());
            if (input.streamLoop) arr.push("-stream_loop", input.streamLoop.toString());
            if (input.type) arr.push("-f", input.type);
            
            if (typeof input.path == "string") {
                arr.push("-i", input.path);

                // Check if copyVideo/Audio doesn't need overriding
                let ext = Utils.getExtension(input.path);
                // Explicitly allow mp3,mov -> mp4 stream copying since they're always compatible
                if (ext == this.output.format || (this.output.format == "mp4" && (ext == "mp3" || ext == "mov")))
                    continue;
                
                // Disable based on file type
                // (by that I mean just checking for audio)
                let type = getInputType(ext);
                if (type == InputType.AUDIO) {
                    copyAudio = false;
                    continue;
                }
            }
            else {
                arr.push("-i", filterToString(input.path));

                // Try to figure out what this filter source is, else just disable copying for both
                // (by that I mean just checking for anullsrc)
                if (input.path.name == "anullsrc") {
                    copyAudio = false;
                    continue;
                }
            }

            copyVideo = copyAudio = false;
        }

        if (this.filterGraph && this.filterGraph.filters.length > 0)
            arr.push("-filter_complex", this.filterGraph.toString());

        if (this.output.streams) {
            for (const stream of this.output.streams) {
                arr.push("-map", stream);
            }
        }

        if (copyVideo)
            arr.push("-c:v", "copy");
        
        if (copyAudio)
            arr.push("-c:a", "copy");

        // Extra args
        if (h264Formats.has(this.output.format)) {
            arr.push("-pix_fmt", "yuv420p");
            if (this.qp) {
                arr.push("-qp", this.qp.toString());
            }
            else {
                arr.push("-preset", "fast");
            }
        }
        else if (this.pixFmt) {
            arr.push("-pix_fmt", this.pixFmt);
        }

        if (!copyAudio) {
            if (this.output.format == "ogg" || this.output.format == "webm") {
                arr.push("-c:a", "libvorbis", "-q:a", "5");
            }
            else if (this.output.format == "mp3") {
                arr.push("-c:a", "libmp3lame", "-q:a", "0");
            }
        }
        // For identification purposes
        arr.push("-metadata", "encoder=balls.leadrdrk.eu.org",
                 "-metadata:s:v", "handler_name=balls.leadrdrk.eu.org",
                 "-metadata:s:a", "encoder=balls");

        if (this.tune)
            arr.push("-tune", this.tune);
        
        if (this.output.loop)
            arr.push("-loop", this.output.loop.toString());

        if (this.output.shortest)
            arr.push("-shortest");

        if (this.output.frames)
            arr.push("-frames:v", this.output.frames.toString());

        let outputPath = this.getOutputPath();
        arr.push(outputPath);

        return arr;
    }

    getOutputPath(): string {
        let filename = this.output.name ? this.output.name : "output";
        return `${this.output.directory}/${filename}.${this.output.format}`;
    }
}

function replaceInputPath(args: FFmpegArgs, oldPath: string, newPath: string) {
    for (const input of args.inputs) {
        if (input.path == oldPath)
            input.path = newPath;
    }
}

async function preprocessMedia(media: MediaInfo, args: FFmpegArgs) {
    let isGif = (media.video?.codec == "gif");
    let outputDir = args.output.directory;
    if (isGif) {
        // Generate palette
        let pgenArgs = new FFmpegArgs([{path: media.path}]);
        pgenArgs.filterGraph = new FFmpegFilterGraph([{name: "palettegen"}]);
        pgenArgs.output = {
            name: "palette",
            directory: outputDir,
            format: "png"
        }
        try {
            await exec(pgenArgs);
        }
        catch (error) {
            throw "Error while trying to preprocess GIF: " + error;
        }
    }
    if (media.video) {
        let { width, height } = media.video;
        let pixelsCount = width * height;

        if (pixelsCount > PIXELS_LIMIT_MAX)
            throw "Media exceeded maximum resolution limit (3000x3000)";

        // Also re-encode to mp4 if file is a gif
        let limitExceeded = (pixelsCount > PIXELS_LIMIT);
        if (!isNaN(media.duration) && (limitExceeded || isGif)) {
            // Scale down to closest res (also make width/height divisible by 2, required by h264)
            let nWidth = width,
                nHeight = height;
            if (limitExceeded) {
                if (args.noScaling) {
                    throw "Video exceeded resolution limit (1280x720). Please use the `ascale` command to scale it down.";
                }
                [nWidth, nHeight] = Utils.getHighestRes(width / height);
            }
                
            if (nWidth % 2 != 0) ++nWidth;
            if (nHeight % 2 != 0) ++nHeight;

            let scaleArgs = new FFmpegArgs([{path: media.path}], false, true);
            scaleArgs.qp = 0; // lossless-ish
            if (nWidth != width || nHeight != height) {
                scaleArgs.filterGraph = new FFmpegFilterGraph([{
                    name: "scale", 
                    options: {
                        width: nWidth.toString(),
                        height: nHeight.toString()
                    }
                }]);
            }
            let outputName = "tmp-" + Utils.getBasename(media.path);
            scaleArgs.output = {
                name: outputName,
                directory: outputDir,
                format: "mp4"
            }
            try {
                await exec(scaleArgs);
            }
            catch (error) {
                throw "Error while trying to scale media: " + error;
            }
            let outputPath = `${outputDir}/${outputName}.mp4`;
            replaceInputPath(args, media.path, outputPath);
        }
    }
}

async function convertGifOutput(output: FFmpegOutput) {
    let mp4File = output.directory + "/output.mp4";
    let paletteFile = output.directory + "/palette.png";
    let args = new FFmpegArgs([{path: mp4File}, {path: paletteFile}]);
    args.filterGraph = new FFmpegFilterGraph([{name: "paletteuse"}]);
    args.output = output;
    try {
        await exec(args);
    }
    catch (error) {
        throw "Error while trying to postprocess GIF: " + error;
    }
}

async function processMedia(medias: MediaInfo[], args: FFmpegArgs): Promise<string> {
    if (args.rawExec)
        return await exec(args);

    // Preproccess files
    for (const media of medias) {
        await preprocessMedia(media, args);
    }

    // Run the actual command + postprocess gifs
    if (args.output.format == "gif") {
        args.output.format = "mp4";
        await exec(args);
        args.output.format = "gif";
        await convertGifOutput(args.output);
    }
    else
        await exec(args);

    // For convenience
    return args.getOutputPath();
}

const FFmpeg = {
    exec,
    getMediaInfo,
    getCachedMediaInfo,
    processMedia
}
export { FFmpeg }