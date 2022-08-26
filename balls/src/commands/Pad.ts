import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";
import { COLOR_ARGS_USAGE } from "../core/Constants";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let padWidth  = args.checkInteger(0);
    let padHeight = args.checkInteger(1);
    let x = 0, y = 0;
    if (args.has(2)) x = args.checkInteger(2);
    if (args.has(3)) y = args.checkInteger(3);
    let color = Utils.parseColorArgs(args, 4);

    // Some quick sanity checks
    if (padWidth <= 0 || padHeight <= 0)
        throw "Padding width, height cannot be smaller than or equal to 0";

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";

        let width = media.video.width;
        let height = media.video.height;

        if (x < 0) x += padWidth;
        if (y < 0) y += padHeight;

        if (x < 0 || y < 0 || x > padWidth || y > padHeight)
            throw "Position out of range.";

        width += padWidth;
        height += padHeight;

        Utils.checkRes(media, width, height);

        let args = new FFmpegArgs([{path: media.path}]);
        args.noScaling = true;
        args.filterGraph = new FFmpegFilterGraph([{
            name: "pad",
            options: {
                x: x.toString(),
                y: y.toString(),
                w: width.toString(),
                h: height.toString(),
                color
            }
        }])
        if (media.path.endsWith(".png")) {
            args.filterGraph.filters.unshift({
                name: "format",
                options: { pix_fmts: "rgba" },
                continuous: true
            });
        }
        args.copyAudio = true;
        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const pad: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "width",  type: "number", required: true,
         desc: "The width to be added."},
        {name: "height", type: "number", required: true,
         desc: "The height to be added."},
        {name: "x",      type: "number", required: false,
         desc: "If value is negative, the X position will start from the right of the image."},
        {name: "y",      type: "number", required: false,
         desc: "If value is negative, the Y position will start from the bottom of the image."},
        ...COLOR_ARGS_USAGE
        
    ],
    shortDesc: "Add extra padding to the image (also referred to as resizing the canvas)",
    aliases: ["resizecanvas"]
}