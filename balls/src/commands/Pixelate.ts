import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let pWidth = 16, pHeight = 16
    if (args.has(0)) pWidth = args.checkInteger(0);
    if (args.has(1)) pHeight = args.checkInteger(1);

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";
        
        let width = media.video.width;
        let height = media.video.height;

        if (pWidth > width || pHeight > height) {
            throw "Invalid pixel size.";
        }

        let nWidth = Math.floor(width / pWidth);
        let nHeight = Math.floor(height / pHeight);

        let args = new FFmpegArgs([{path: media.path}]);
        args.noScaling = true;
        args.filterGraph = new FFmpegFilterGraph([{
            name: "scale",
            options: {
                width: nWidth.toString(),
                height: nHeight.toString()
            },
            continuous: true
        },
        {
            name: "scale",
            options: {
                width: width.toString(),
                height: height.toString(),
                flags: "neighbor"
            },
        }
        ])
        args.copyAudio = true;
        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const pixelate: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "width",  type: "number", required: false,
         desc: "The pixel width. Default: 16"},
        {name: "height", type: "number", required: false,
         desc: "The pixel height. Default: 16"}
    ],
    shortDesc: "Pixelate a video/image",
    aliases: ["pixelize"]
}