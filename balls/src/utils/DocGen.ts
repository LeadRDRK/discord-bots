// DocGen: generate json and markdown files for all commands
import fs from "node:fs";
import { Commands } from "../commands";
import { Command } from "../core";

type Entries = [string, Command][];
interface CommandDoc extends Command {
    name: string;
}

function generateJson(entries: Entries): string {
    let arr: CommandDoc[] = [];
    for (const [name, command] of entries) {
        if (command.private) continue;
        let cmdDoc: CommandDoc = {
            name,
            ...command
        }
        arr.push(cmdDoc);
    }
    return JSON.stringify(arr);
}

function generateMd(entries: Entries): string {
    let str = "";
    for (const [name, command] of entries) {
        str += `## ${name}

**${command.shortDesc}**

`;

        if (command.desc) {
            str += command.desc + "\n\n";
        }

        if (command.aliases) {
            str += `- **Aliases:** ${command.aliases.join(", ")}\n\n`;
        }

        if (command.parseOptions) {
            let options = command.parseOptions;
            if (options.inputCount) {
                str += `- **Input files needed:** ${options.inputCount}\n\n`
            }
        }

        if (command.vaArgs) {
            str += `- **Variable arguments:** Separated by \`${command.vaArgs}\`\n\n`;
        }

        str += `- **Arguments:** ${command.usage.length ? command.usage.length : "none"}\n\n`;
        if (command.usage.length) {
            str += `| Name | Type | Required | Description |
| :---: | :---: | :---: | --- |
`;
            for (const arg of command.usage) {
                str += `| ${arg.name} | ${arg.type} | ${arg.required ? "✓" : ""} | ${arg.desc ? arg.desc : ""} |\n`;
            }
        }
    }

    return str;
}

function run() {
    let entries = Object.entries(Commands);
    let jsonContent = generateJson(entries);
    let mdContent = generateMd(entries);

    try {
        fs.accessSync("./docs", fs.constants.F_OK);
    }
    catch {
        fs.mkdirSync("./docs");
    }

    console.log("-- Writing commands.json...");
    fs.writeFileSync("./docs/commands.json", jsonContent);

    console.log("-- Writing commands.md...");
    fs.writeFileSync("./docs/commands.md", mdContent);

    console.log("-- Done.");
    process.exit(0);
}

run();