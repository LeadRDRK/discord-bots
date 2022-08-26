import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, getInputType, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let delay = 0;
    if (args.has(0)) {
        delay = args.checkTimestamp(0);

        if (delay < 0 || delay > 120)
            throw "Delay out of range (0s < delay < 120s)";
    }

    let durationType = "shortest";
    if (args.has(1)) {
        durationType = args.getString(1).toLowerCase();
        if (durationType != "shortest" && durationType != "longest")
            throw "Invalid duration type (expected `shortest` or `longest`)";
    }

    let loopCount = 0;
    if (args.has(2)) {
        loopCount = args.checkInteger(2);

        if (loopCount < 0 || loopCount > 10)
            throw "Loop count out of range.";
    }

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs => {
        // Figure out which file is the video/audio file
        let audioMedia: MediaInfo,
            videoMedia: MediaInfo;
        [audioMedia, videoMedia] = Utils.getAudioVideoMedias(medias);

        let hasGif = videoMedia.video!.codec == "gif";
        let hasDelay = delay > 0;

        let args = new FFmpegArgs([{path: videoMedia.path}, {path: audioMedia.path}]);
        args.copyVideo = true;

        let format = Utils.getExtension(videoMedia.path);
        args.output.format = (getInputType(format) == InputType.VIDEO) ? format : "mp4";

        if (hasDelay) {
            let sampleRate = audioMedia.audio!.sampleRate;
            let channels = audioMedia.audio!.channels;
            if (isNaN(sampleRate))
                throw "Cannot add delay to audio (failed to detect sample rate)";

            args.inputs.push({
                type: "lavfi",
                path: {
                    name: "anullsrc",
                    options: {
                        r: sampleRate.toString(),
                        cl: channels,
                        d: delay.toString()
                    }
                }
            });
        }
        else args.copyAudio = true;

        if (durationType == "shortest" || isNaN(videoMedia.duration))
            args.output.shortest = true;
        else if (durationType == "longest" && hasGif) {
            args.output.shortest = true;
            loopCount = -1;
        }

        if (hasGif)
            args.inputs[0].streamLoop = loopCount;
        
        // Normal images
        if (isNaN(videoMedia.duration)) {
            args.inputs[0].loop = 1;
            args.tune = "stillimage";
        }
        
        args.filterGraph = new FFmpegFilterGraph;

        // Check if width/height is divisible by 2
        let hasScaling = false;
        if (args.output.format == "mp4") {
            let width = videoMedia.video!.width;
            let height = videoMedia.video!.height;

            let nWidth = width, nHeight = height;
            if (width % 2 != 0) ++nWidth;
            if (height % 2 != 0) ++nHeight;
            
            hasScaling = (nWidth != width || nHeight != height);
            if (hasScaling) {
                args.filterGraph.filters.push({
                    inputs: ["0:v"],
                    name: "scale",
                    options: {
                        width: nWidth.toString(),
                        height: nHeight.toString()
                    },
                    outputs: ["v"]
                });
                args.copyVideo = false;
            }
        }
        
        if (hasDelay) {
            args.filterGraph.filters.push({
                inputs: ["2:a", "1:a"],
                name: "concat",
                options: {
                    n: "2",
                    v: "0",
                    a: "1"
                },
                outputs: ["a"]
            });
        }

        args.output.streams = [hasScaling ? "[v]" : "0:v", hasDelay ? "[a]" : "1:a"];
        args.output.directory = workDir.path;

        return args;
    });
}

export const addaudio: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 2,
        inputTypes: InputType.ALL
    },
    
    usage: [
        {name: "delay", type: "timestamp", required: false,
         desc: "Delay/Add silence before audio starts. Limit is 2 minutes. Default: 0"},
        {name: "duration type", type: "string", required: false,
         desc: "Duration of the output video. By default, this is set to `shortest` which cuts the video when the " +
               "original video or audio ends, whichever comes first. Otherwise, `longest` can be used to extend the " +
               "video until the audio ends or vice versa. You might wanna use it with GIFs."},
        {name: "loop count", type: "number", required: false,
         desc: "GIF loop count. This is ignored on other formats, or if `duration` is already set to `longest`. " +
               "Cannot be larger than 10 (the `longest` duration type can bypass this limit). Default: 0"}
    ],
    shortDesc: "Add audio to an image or replace the audio in a video",
    desc: "The audio and video files can be given in any order. In case both files have audio and video, " +
          "the first file will be used for audio, and the second file will be used for video.\n" +
          "For GIFs, it is recommended that you invoke the command with '0 longest' as the parameters if " +
          "you want it to loop until the end of the audio. Otherwise, you may set the loop count yourself.",
    aliases: ["setaudio", "replaceaudio"]
}