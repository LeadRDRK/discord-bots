import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

const pixelsLimit = 360*360;
async function execute(msg: Message, _: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let media = medias[0];
        if (!media.video)
            throw "No video stream detected.";
        
        let args = new FFmpegArgs([{path: media.path}]);
        args.rawExec = true;

        if (media.duration > 10)
            args.inputs[0].duration = 10;

        args.filterGraph = new FFmpegFilterGraph;
        if (media.video.fps > 15 && media.duration > 1) {
            args.filterGraph.filters.push({
                inputs: ["0:v"],
                name: "fps",
                options: { fps: "15" },
                continuous: true
            });
        }

        let width = media.video.width;
        let height = media.video.height
        let pixelsCount = width * height;

        if (pixelsCount > pixelsLimit && media.duration > 1) {
            let [nWidth, nHeight] = Utils.getHighestRes(width / height, pixelsLimit);
            args.filterGraph.filters.push({
                inputs: args.filterGraph.filters.length ? undefined : ["0:v"],
                name: "scale", 
                options: {
                    width: nWidth.toString(),
                    height: nHeight.toString()
                },
                continuous: true
            });
        }

        args.filterGraph.filters.push({
            inputs: args.filterGraph.filters.length ? undefined : ["0:v"],
            name: "split",
            outputs: ["a", "b"]
        }, {
            inputs: ["a"],
            name: "palettegen",
            outputs: ["p"],
        }, {
            inputs: ["b", "p"],
            name: "paletteuse",
        });

        args.output.directory = workDir.path;
        args.output.format = "gif";

        return args;
    });
}

export const togif: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 1,
        inputTypes: InputType.VIDEO | InputType.IMAGE
    },
    
    usage: [],
    shortDesc: "Convert a video or an image to a GIF",
    aliases: ["gif"]
}