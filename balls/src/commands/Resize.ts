import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

const algorithms = new Set<string>(["bilinear", "bicubic", "neighbor"]);
async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let width  = args.checkInteger(0);
    let height = args.checkInteger(1);
    let algorithm = "bilinear";
    if (args.has(2)) {
        algorithm = args.getString(2);
        if (!algorithms.has(algorithm)) {
            throw "Invalid scaling algorithm.";
        }
    }

    // Some quick sanity checks
    if (width <= 0 || height <= 0)
        throw "Width, height cannot be smaller than or equal to 0.";

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";

        Utils.checkRes(media, width, height);

        let mWidth = media.video.width;
        let mHeight = media.video.height;
        
        if (width == mWidth && height == mHeight)
            throw `Image is already at ${width}x${height}`;

        let args = new FFmpegArgs([{path: media.path}]);
        args.filterGraph = new FFmpegFilterGraph([{
            name: "scale",
            options: {
                width: width.toString(),
                height: height.toString(),
                flags: algorithm
            }
        }])
        args.copyAudio = true;
        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const resize: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "width",  type: "number", required: true},
        {name: "height", type: "number", required: true},
        {name: "algorithm", type: "string", required: false,
         desc: "The scaling algorithm. Possible values: `bilinear`, `bicubic`, `neighbor`. Default: `bilinear`"}
    ],
    shortDesc: "Resize a video or an image",
    desc: "Max size is 1280x720. Will refuse to resize if the image already has the same size.",
    aliases: ["scale"]
}