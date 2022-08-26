import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let width = NaN, height = NaN, start = 0, duration = 0;
    let x = args.checkNumber(0);
    let y = args.checkNumber(1);
    if (args.has(2)) width = args.checkNumber(2);
    if (args.has(3)) height = args.checkNumber(3);
    if (args.has(4)) start = args.checkTimestamp(4);
    if (args.has(5)) duration = args.checkTimestamp(5);

    // Some quick sanity checks
    if (width < 0 || height < 0)
        throw "Width, height cannot be smaller than 0";

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        let [other, source] = medias;
        if (!source.video || !other.video)
            throw "No video stream detected for one or both of the files.";

        let mWidth  = other.video.width;
        let mHeight = other.video.height;

        if (x < 0) x += source.video.width;
        if (y < 0) y += source.video.height;

        if (x < 0 || y < 0)
            throw "Position out of range.";

        if (!width  || isNaN(width))  width  = mWidth
        if (!height || isNaN(height)) height = mHeight;

        [start, duration] = Utils.checkStartDuration(start, duration, source.duration);

        let args = new FFmpegArgs([{path: other.path}]);
        args.noScaling = true;
        args.copyAudio = true;
        args.filterGraph = new FFmpegFilterGraph;

        let mediaHasDuration = true;
        if (Utils.isVideo(source) || Utils.isVideo(other))
            args.output.format = "mp4";
        else if (source.video.codec == "gif" || other.video.codec == "gif")
            args.output.format = "gif";
        else { // image (or something weird?)
            args.output.format = Utils.getExtension(source.path);
            mediaHasDuration = false;
        }

        // Second input (after the "other" media) will always be the one to add the overlay to
        if (mediaHasDuration) {
            args.inputs.push({path: source.path, start, duration}); // start, duration might be undefined
            if (start > 0 || duration != source.duration) {
                // Used for audio only
                args.inputs.push({path: source.path});
                
                if (start > 0)
                    args.inputs.push({path: source.path, duration: start});

                if (duration != source.duration)
                    args.inputs.push({path: source.path, start: (start ? start : 0) + duration});
            }
        }
        else
            args.inputs.push({path: source.path});

        let otherHasScaling = width != mWidth || height != mHeight;
        if (otherHasScaling) {
            args.filterGraph.filters.push({
                inputs: ["0:v"],
                name: "scale",
                options: {
                    width: width.toString(),
                    height: height.toString()
                },
                outputs: ["sv"]
            });
        }

        // Check if width/height is divisible by 2
        if (args.output.format == "mp4" && isNaN(source.duration)) {
            if (source.video.width % 2 != 0 || source.video.height % 2 != 0) {
                throw "Cannot add video onto image with dimensions not divisible by 2 (Did you have the files ordered incorrectly?)";
            }
        }

        args.filterGraph.filters.push({
            inputs: ["1:v", otherHasScaling ? "sv" : "0:v"],
            name: "overlay",
            options: {
                x: x.toString(),
                y: y.toString()
            },
            outputs: [args.inputs.length > 2 ? "ov" : "v"]
        });

        if (args.inputs.length > 2) {
            let inputs = ["ov"];
            if (start > 0) inputs.unshift("3:v");
            if (duration) inputs.push(start > 0 ? "4:v" : "3:v");
            args.filterGraph.filters.push({
                inputs,
                name: "concat",
                options: {
                    n: (args.inputs.length - 2).toString(),
                    v: "1",
                    a: "0"
                },
                outputs: ["v"]
            })
        }

        args.output.streams = ["[v]"];
        if (source.audio) {
            args.output.streams.push(args.inputs.length > 2 ? "2:a" : "1:a");
        }
        args.output.directory = workDir.path;

        return args;
    });
}

export const overlay: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 2,
        inputTypes: InputType.VIDEO | InputType.IMAGE | InputType.AIMAGE
    },
    
    usage: [
        {name: "x", type: "number", required: true,
         desc: "If value is negative, the X position will start from the right of the image."},
        {name: "y", type: "number", required: true,
         desc: "If value is negative, the Y position will start from the bottom of the image."},
        {name: "width", type: "number", required: false,
         desc: "By default, this is set to 0 which means no scaling. Same for the height argument."},
        {name: "height", type: "number", required: false},
        {name: "start time", type: "timestamp", required: false,
         desc: "Specify when the overlay should start appearing. Can be a negative value."},
        {name: "duration", type: "timestamp", required: false,
         desc: "The duration for which the overlay will stay on screen. Can also be a negative value."}
    ],
    shortDesc: "Overlay an image/video onto another",
    desc: "The optional width and height arguments can be used to scale the image before overlaying. The " +
          "output file format will depend on which formats were provided. The priority is as follows: " +
          "video > gif > image.\n" +
          "Note: This command does not mix/overlay audio if the other media contains it. The `mixaudio` " +
          "command can be used after overlaying to achieve that result."
}