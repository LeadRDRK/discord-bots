import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let loopCount = 0;
    if (args.has(0)) {
        loopCount = args.checkInteger(0);
        if (loopCount < 0 || loopCount > 10)
            throw "Loop count out of range.";
    }

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";
        
        let args = new FFmpegArgs([{path: media.path, streamLoop: loopCount}]);
        args.rawExec = true;

        if (media.duration > 60)
            args.inputs[0].duration = 60;
        
        // Check if width/height is divisible by 2
        let width = media.video.width;
        let height = media.video.height;

        let nWidth = width, nHeight = height;
        if (width % 2 != 0) ++nWidth;
        if (height % 2 != 0) ++nHeight;
        
        if (nWidth != width || nHeight != height) {
            args.filterGraph = new FFmpegFilterGraph([{
                name: "scale",
                options: {
                    width: nWidth.toString(),
                    height: nHeight.toString()
                }
            }]);
        }
        
        args.output.directory = workDir.path;
        args.output.format = "mp4";

        return args;
    });
}

export const tomp4: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.AIMAGE
    },
    
    usage: [
        {name: "loop count", type: "number", required: false,
         desc: "GIF loop count. Cannot be larger than 10. Default: 0"}
    ],
    shortDesc: "Convert a GIF to an MP4 file",
    aliases: ["mp4"]
}