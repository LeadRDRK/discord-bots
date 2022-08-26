import { Message } from "discord.js";
import { Command, CommandArgs, CommandInputs } from ".";
import { Commands } from "../commands";
import { ScriptExecutor } from "./ScriptExecutor";
import { InputType, getInputFormats } from "../media/InputType";
import { InputFetcher } from "./InputFetcher";
import Utils from "./Utils";
import { FFmpeg } from "../media";

let commands: {[key: string]: Command} = {};
function init(): boolean {
    // Generate commands index
    let entries = Object.entries(Commands);
    for (const [name, command] of entries) {
        commands[name] = command;

        if (!command.aliases) continue;
        command.aliases.forEach(alias => {
            if (alias in commands) {
                console.log(`WARNING: "${alias}" already exists in command list, overriding.`);
            }
            commands[alias] = command;
        });
    };
    console.log(`--- Loaded ${entries.length} commands`);
    return true;
}

function parseCommand(content: string, start: number) : [number, Command | undefined] {
    let end = content.indexOf(" ", start);
    if (end == -1) end = content.length;
    let name = content.slice(start, end).toLowerCase();
    return [start + name.length + 1, commands[name]];
}

async function parseString(content: string, start: number, scriptInit: string) : Promise<[number, string]> {
    let delimiter = content[start],
        str = "",
        escaped = false,
        done = false,
        i: number;
    
    // Unquoted strings
    if (!delimiter.match(/'|"/)) {
        i = content.indexOf(" ", start);
        if (i == -1) i = content.length;
        return [i - start, content.slice(start, i)];
    }
    
    for (i = start + 1; i < content.length; ++i) {
        let char = content[i];
        if (escaped) {
            if (!char.match(/`|"|'|!|\\/)) {
                // Invalid escape sequence, but this is a bot, not a program :)
                str += "\\";
            }
            str += char;
            escaped = false;
            continue;
        }
        switch (char) {
        case "\\":
            escaped = true;
            break;
        
        case delimiter:
            done = true;
            break;
        
        case "`":
        {
            // Embedded script
            let [increment, results] = await parseScript(content, i, scriptInit);
            str += results.join(" ");
            i += increment - 1;
            break;
        }

        default:
            str += char;
            break;
        }
        if (done) break;
    }

    if (!done) {
        throw "Unfinished string (missing end delimiter)";
    }

    return [i + 1 - start, str];
}

async function parseScript(content: string, start: number, scriptInit: string, noExecuteScript?: boolean) : Promise<[number, Array<string>]> {
    let stringDelim = "",
        script = "",
        done = false,
        i: number;

    for (i = start + 1; i < content.length; ++i) {
        let char = content[i];
        if (stringDelim) {
            script += char;
            if (char == "\\")
                script += content[++i];
            else if (content.slice(i, i + stringDelim.length) == stringDelim) {
                stringDelim = "";
                i += stringDelim.length;
                if (i >= content.length - 1)
                    done = true;
            }
            
            continue;
        }

        switch (char)
        {
        case "`":
            done = true;
            break;
        
        case '"':
        case "'":
        case "[":
            if (char == "[") {
                if (content[i + 1] == "[")
                    stringDelim = "]]";
            }
            else
                stringDelim = char;

        default:
            script += char;
            break;

        }

        if (done) break;
    }

    if (!done) {
        throw "Unfinished script (missing end delimiter)";
    }

    let expand = (content[++i] == "!");
    if (expand) ++i;

    if (noExecuteScript)
        return [i - start, [script]];
    else {
        let values = await ScriptExecutor.evalValues(script, scriptInit);
        return [i - start, expand ? values : values.slice(0, 1)]; // slice to avoid undefined
    }
}

function getLineColumn(content: string, pos: number) : [number, number] {
    let lineNum = 1;
    
    let searchPos = pos;
    let lineStart = 0;
    while ((searchPos = content.lastIndexOf("\n", searchPos)) != -1) {
        ++lineNum;
        if (!lineStart) lineStart = searchPos;
    }

    return [lineNum, pos - lineStart + 1];
}

function parsingError(error: any, msg: Message, currentPos: number) {
    if (typeof error != "string" || error.length == 0) {
        error = "Unknown error while parsing command";
        console.log(`[ERROR] Unknown parsing error, content: "${msg.content}"`);
    }
    const [lineNum, columnNum] = getLineColumn(msg.content, currentPos); 
    msg.reply(`${error} (at line ${lineNum}, column ${columnNum})`);
}

export interface ParseResult {
    command?: Command,
    args?: CommandArgs,
    inputs?: CommandInputs
}

export interface ParseOptions {
    inputCount?: number,
    // These two will be concatenated together
    inputTypes?: InputType,
    inputFormats?: Set<string>,
    //
    noExecuteScript?: boolean
}

// This regex only check for strings that begins with an url
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const ARGS_LIMIT = 10;
async function parse(prefix: string, msg: Message): Promise<ParseResult> {
    let content = msg.content;
    let result: ParseResult = {};

    let startIndex: number;
    [startIndex, result.command] = parseCommand(content, prefix.length);
    if (!result.command) return result;
    let options = result.command.parseOptions || {};

    result.args = new CommandArgs;

    let increment = 1;
    let scriptInit = ScriptExecutor.getScriptInit(msg);
    let needInput = (options.inputCount && options.inputCount > 0);
    let inputSpecifiers: string[] = [];
    // Start parsing right after prefix
    for (let i = startIndex; i < content.length; i += increment)
    {
        if (increment <= 0) {
            msg.reply("Failed to parse your command due to a bug. Please report this to the developer.");
            return {};
        }
        increment = 0;
        let char = content[i];

        // Skip excess spaces
        if (char == " " || char == "\n")
        {
            increment = 1;
            continue;
        }

        if (needInput) {
            let end = content.indexOf(" ", i);
            if (end == -1) end = content.length;
            let arg = Utils.getArgUrl(content.slice(i, end));

            if (content.startsWith("::", i)) {
                inputSpecifiers.push(arg);
                increment = end - i;
                continue;
            }
            else {
                if (URL_REGEX.test(arg)) {
                    inputSpecifiers.push(arg);
                    increment = end - i;
                    continue;
                }

                if (inputSpecifiers.length > 0) {
                    parsingError("Arguments placed after input specifiers are not allowed.", msg, i);
                    return {};
                }
            }
        }

        // Stop parsing at limit
        if (result.args.length >= ARGS_LIMIT) {
            break;
        }

        try {
            let ret: string | Array<string>;
            // Still need to differentiate between these two because when scripts are used alone,
            // they can be expanded to multiple args using the ! syntax
            if (char == "`") {
                [increment, ret] = await parseScript(content, i, scriptInit, options.noExecuteScript);
                result.args.push(...ret);
            }
            else {
                [increment, ret] = await parseString(content, i, scriptInit);
                result.args.push(ret);
            }
        }
        catch (error)
        {
            parsingError(error, msg, i);
            return {};
        }
    }

    if (needInput && (options.inputTypes || options.inputFormats)) {
        if (options.inputTypes) {
            // Generate the format list
            if (!options.inputFormats) options.inputFormats = new Set;
            getInputFormats(options.inputTypes).forEach(value => options.inputFormats!.add(value));
            options.inputTypes = undefined;
        }
        
        result.inputs = [];
        try {
            await InputFetcher.fetchInputFiles(msg, inputSpecifiers, result.inputs, options);
        }
        catch (error) {
            msg.reply(String(error));
            return {};
        }
    }

    return result;
}

let CommandParser = {
    init,
    parse
};

export { CommandParser };