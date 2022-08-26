import { Message } from "discord.js"
import { Command, CommandArgs, CommandInputs, WorkDir } from "../core"
import Utils from "../core/Utils";
import { FFmpegArgs, FFmpegFilterGraph, InputType, MediaInfo } from "../media";

async function execute(msg: Message, args: CommandArgs, inputs: CommandInputs): Promise<void | WorkDir> {
    let delay = 0, start = NaN, duration = NaN;
    if (args.has(0)) {
        delay = args.checkTimestamp(0);

        if (delay < 0 || delay > 120)
            throw "Delay out of range (0s < delay < 120s)";
    }
    if (args.has(1)) start = args.checkTimestamp(1);
    if (args.has(2)) duration = args.checkTimestamp(2);

    return await Utils.createProcessMediaTask(inputs, msg, (workDir: WorkDir, medias: MediaInfo[]): FFmpegArgs[] => {
        let [other, source] = medias;
        if (!source.audio || !other.audio)
            throw "No audio stream detected for one or both of the files.";

        [start, duration] = Utils.checkStartDuration(start, duration, other.duration);

        let argsArr: FFmpegArgs[] = [];

        let args = new FFmpegArgs([{path: source.path}, {path: other.path, start, duration}]);
        args.filterGraph = new FFmpegFilterGraph;
        
        let hasDelay = delay > 0;
        if (hasDelay) {
            let sampleRate = other.audio.sampleRate;
            let channels = other.audio.channels;
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

            args.filterGraph.filters.push({
                inputs: ["2:a", "1:a"],
                name: "concat",
                options: {
                    n: "2",
                    v: "0",
                    a: "1"
                },
                outputs: ["a1"]
            });
        }

        args.filterGraph.filters.push({
            inputs: ["0:a", hasDelay ? "a1" : "1:a"],
            name: "amix",
            options: {
                duration: "first",
                dropout_transition: "0",
                normalize: "0"
            },
            outputs: ["a2"]
        });
        
        args.output.streams = ["[a2]"];
        args.output.directory = workDir.path;
        args.output.name = "aoutput";
        args.output.format = source.video ? "wav" : Utils.getOutputFormat(source.path);

        argsArr.push(args);

        // Merge audio in separately (because of a weird ffmpeg quirk that cuts off audio early)
        if (source.video) {
            let mArgs = new FFmpegArgs([{path: source.path}, {path: args.getOutputPath()}]);
            mArgs.copyVideo = true;
            mArgs.output.streams = ["0:v", "1:a"];
            mArgs.output.directory = workDir.path;
            // Seems to be fine to just use the original format
            mArgs.output.format = Utils.getExtension(source.path);

            argsArr.push(mArgs);
        }

        return argsArr;
    });
}

export const mixaudio: Command = {
    execute: execute,
    parseOptions: {
        inputCount: 2,
        inputTypes: InputType.VIDEO | InputType.AUDIO
    },
    
    usage: [
        {name: "delay", type: "timestamp", required: false,
         desc: "Delay/Add silence before the audio starts. Limit is 2 minutes. Default: 0"},
        {name: "start time", type: "timestamp", required: false,
         desc: "Time for the audio to start from. If the value is negative, it will start from the end."},
        {name: "duration",   type: "timestamp", required: false,
         desc: "Duration of the audio. If not specified, it will play until the end. Can also be negative."},
    ],
    shortDesc: "Mix/Merge audio from 2 different sources",
    desc: "The output file format and length will be based on the second file.",
    aliases: ["overlayaudio", "mergeaudio"]
}