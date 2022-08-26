import { Message } from "discord.js";
import { ParseOptions, WorkDir } from "../core/";
import Utils from "./Utils";

export class CommandArgs {
    private _args: Array<string> = [];

    push(...values: string[]) {
        this._args.push(...values);
    }

    unshift(...values: string[]) {
        this._args.unshift(...values);
    }

    getString(index: number) {
        return this._args[index];
    }

    has(index: number) {
        return index in this._args;
    }

    getNumber(index: number) {
        return Number(this._args[index]);
    }

    getInteger(index: number) {
        return Math.floor(this.getNumber(index));
    }

    checkNumber(index: number) {
        let number = Number(this._args[index]);
        if (isNaN(number)) throw `Bad argument #${index + 1}: Not a valid number`;
        return number;
    }

    checkInteger(index: number) {
        return Math.floor(this.checkNumber(index));
    }

    getArray() {
        return this._args;
    }

    getTimestamp(index: number): number {
        let str = this._args[index];
        let timestamp = Number(str);
        if (isNaN(timestamp)) {
            if (Utils.isTimestampStr(str)) 
                timestamp = Utils.parseTimestampStr(str);
        }
        return timestamp;
    }

    checkTimestamp(index: number) {
        let timestamp = this.getTimestamp(index);
        if (isNaN(timestamp)) throw `Bad argument #${index + 1}: Not a valid timestamp`;
        return timestamp;
    }

    checkBoolean(index: number) {
        let str = this._args[index].toLowerCase();
        let val: boolean;
        if (str == "1" || str == "true")
            val = true;
        else if (str == "0" || str == "false")
            val = false;
        else
            throw `Bad argument #${index + 1}: Not a valid boolean`;
        
        return val;
    }

    getBoolean(index: number) {
        try {
            return this.checkBoolean(index);
        }
        catch {
            return false;
        }
    }

    split(sep?: string): CommandArgs[] {
        if (!sep) sep = "|";
        let argsArr: CommandArgs[] = [];
        let curArgs = new CommandArgs;

        for (const arg of this._args) {
            if (arg == sep) {
                argsArr.push(curArgs);
                curArgs = new CommandArgs;
            }
            else {
                curArgs.push(arg);
            }
        }

        argsArr.push(curArgs);
        return argsArr;
    }

    get length() {
        return this._args.length;
    }
}

export class InputFile {
    readonly url: string;
    public path?: string;

    constructor(url: string) {
        this.url = url;
    }
}

export type CommandInputs = Array<InputFile>;

export interface CommandArgDef {
    name: string;
    type: "string" | "number" | "timestamp" | "boolean";
    required: boolean;
    desc?: string;
}

export type CommandUsage = CommandArgDef[];

export interface Command {
    execute(msg: Message, args: CommandArgs, inputs?: CommandInputs): Promise<void | WorkDir>;
    private?: boolean;
    parseOptions?: ParseOptions;
    noTyping?: boolean;

    // Info
    usage: CommandUsage;
    vaArgs?: string; // Value is args separator (usually the pipe character)
    shortDesc: string;
    desc?: string;
    aliases?: Array<string>;
}