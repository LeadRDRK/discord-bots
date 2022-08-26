import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, PIXELS_LIMIT, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

async function execute(msg: Message, _: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";

        let width = media.video.width;
        let height = media.video.height;
        
        if (width * height <= PIXELS_LIMIT)
            throw "Media is already optimal, no scaling will be done.";
        
        [width, height] = Utils.getHighestRes(width / height, PIXELS_LIMIT, true);

        let args = new FFmpegArgs([{path: media.path}]);
        args.rawExec = true;
        args.filterGraph = new FFmpegFilterGraph([{
            name: "scale",
            options: {
                width: width.toString(),
                height: height.toString()
            }
        }])
        args.copyAudio = true;
        args.output.directory = workDir.path;
        args.output.format = Utils.getOutputFormat(media.path);

        return args;
    });
}

export const autoscale: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE
    },
    
    usage: [],
    shortDesc: "Scale a video/image down to a compatible resolution",
    desc: "Note: This command does not support GIFs.",
    aliases: ["ascale"]
}