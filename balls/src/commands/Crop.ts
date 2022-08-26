import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, PIXELS_LIMIT, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let x      = args.checkInteger(0);
    let y      = args.checkInteger(1);
    let width  = args.checkInteger(2);
    let height = args.checkInteger(3);

    // Some quick sanity checks
    if (width <= 0 || height <= 0)
        throw "Width, height cannot be smaller than or equal to 0";

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";

        let mWidth = media.video.width;
        let mHeight = media.video.height;

        if (x < 0) x = mWidth  + x;
        if (y < 0) y = mHeight + y;

        if (x < 0 || y < 0)
            throw "Crop position out of range.";

        // Boundary check
        if (x + width > mWidth)
            throw "Crop width out of range.";
        if (y + height > mHeight)
            throw "Crop height out of range.";

        let args = new FFmpegArgs([{path: media.path}]);
        args.noScaling = true;
        args.filterGraph = new FFmpegFilterGraph([{
            name: "crop",
            options: {
                x: x.toString(),
                y: y.toString(),
                w: width.toString(),
                h: height.toString()
            }
        }])
        args.copyAudio = true;
        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const crop: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "x",      type: "number", required: true,
         desc: "If value is negative, the X position will start from the right of the image."},
        {name: "y",      type: "number", required: true,
         desc: "If value is negative, the Y position will start from the bottom of the image."},
        {name: "width",  type: "number", required: true},
        {name: "height", type: "number", required: true}
    ],
    shortDesc: "Crop a video or an image"
}