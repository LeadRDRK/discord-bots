import { promises as fs } from "node:fs";

export enum ASSWrap {
    SMART = 0,
    EOL  = 1,
    NONE = 2
}

export interface ASSInfo {
    wrapStyle: ASSWrap;
    playResX: number;
    playResY: number;
}

function toHex(n: number): string {
    return n.toString(16).toUpperCase().padStart(2, "0");
}

export class ASSColor {
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(v: number);
    constructor(r: number, g: number, b: number, a: number);
    constructor(v: number, g?: number, b?: number, a?: number) {
        if (g && b && a) {
            this.r = v;
            this.g = g;
            this.b = b;
            this.a = a;
        }
        else {
            this.r = (v >> 24) & 0xff;
            this.g = (v >> 16) & 0xff;
            this.b = (v >> 8)  & 0xff;
            this.a = v         & 0xff;
        }
    }

    toString(): string {
        let a = toHex(this.a);
        let b = toHex(this.b);
        let g = toHex(this.g);
        let r = toHex(this.r);
        return `&H${a}${b}${g}${r}&`;
    }
}

export type ASSColorResolvable = ASSColor | number;

function colorToABGR(color: ASSColorResolvable): string {
    if (typeof color == "number") color = new ASSColor(color);
    return color.toString();
}

// Based on numpad layout
export enum ASSAlign {
    TOP_LEFT    = 7, TOP_CENTER    = 8, TOP_RIGHT    = 9,
    MIDDLE_LEFT = 4, CENTER        = 5, MIDDLE_RIGHT = 6,
    BOTTOM_LEFT = 1, BOTTOM_CENTER = 2, BOTTOM_RIGHT = 3
}

function toBoolVal(b: boolean): string {
    return b ? "-1" : "0";
}

const stylesFormat = "Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding";
export class ASSStyle {
    name: string = "Default";
    fontName: string = "Arial"; 
    fontSize: number = 20; 
    primaryColour: ASSColorResolvable = 0xffffff00;
    secondaryColour: ASSColorResolvable = 0xff000000;
    outlineColour: ASSColorResolvable = 0;
    backColour: ASSColorResolvable = 0;
    bold: boolean = false;
    italic: boolean = false;
    underline: boolean = false;
    strikeOut: boolean = false;
    scaleX: number = 1;
    scaleY: number = 1;
    spacing: number = 0;
    angle: number = 0;
    opaqueBox: boolean = false; // BorderStyle
    outline: number = 0;
    shadow: number = 0;
    alignment: ASSAlign = ASSAlign.BOTTOM_CENTER;
    marginL: number = 10;
    marginR: number = 10;
    marginV: number = 10;
    encoding: number = 1;

    toString(): string {
        let primaryColour = colorToABGR(this.primaryColour);
        let secondaryColour = colorToABGR(this.secondaryColour);
        let outlineColour = colorToABGR(this.outlineColour);
        let backColour = colorToABGR(this.backColour);
        let borderStyle = this.opaqueBox ? "3" : "1";

        return "Style: " +
        `${this.name},${this.fontName},${this.fontSize},${primaryColour},${secondaryColour},${outlineColour},` +
        `${backColour},${toBoolVal(this.bold)},${toBoolVal(this.italic)},${toBoolVal(this.underline)},` +
        `${toBoolVal(this.strikeOut)},${this.scaleX*100},${this.scaleY*100},${this.spacing},${this.angle},${borderStyle},` +
        `${this.outline},${this.shadow},${this.alignment},${this.marginL},${this.marginR},${this.marginV},${this.encoding}\n`;
    }
}

function toTimeStr(t: number): string {
    var hours   = Math.floor(t / 3600).toString();
    var minutes = Math.floor((t % 3600) / 60).toString().padStart(2, "0");
    var seconds = (t % 60).toFixed(2).padStart(5, "0");

    return `${hours}:${minutes}:${seconds}`;
}

const eventsFormat = "Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text";
export class ASSEvent {
    layer: number = 0;
    start: number = 0;
    end: number = 0;
    style: string = "Default";
    name: string = "";
    marginL: number = 0;
    marginR: number = 0;
    marginV: number = 0;
    effect: string = "";
    text: string = "";

    toString(): string {
        let start = toTimeStr(this.start);
        let end = toTimeStr(this.end);

        return "Dialogue: " +
        `${this.layer},${start},${end},${this.style},${this.name},${this.marginL},${this.marginR},${this.marginV},` +
        `${this.effect},${this.text.replace(/\n/g, "\\N")}\n`;
    }
}

export class ASSBuilder {
    info: ASSInfo = {
        wrapStyle: ASSWrap.SMART,
        playResX: 640,
        playResY: 480
    };
    styles: ASSStyle[] = [];
    events: ASSEvent[] = [];

    serialize(): string {
        let styleLines = "";
        for (const style of this.styles) {
            styleLines += style.toString();
        }

        let eventLines = "";
        for (const event of this.events) {
            eventLines += event.toString();
        }

        return `[Script Info]
ScriptType: v4.00+
WrapStyle: ${this.info.wrapStyle}
PlayResX: ${this.info.playResX}
PlayResY: ${this.info.playResY}

[V4+ Styles]
Format: ${stylesFormat}
${styleLines}

[Events]
Format: ${eventsFormat}
${eventLines}
`;
    }

    async writeFile(workDir: string, name?: string): Promise<string> {
        if (!name) name = "text";
        let path = `${workDir}/${name}.ass`;
        try {
            await fs.writeFile(path, this.serialize());
        }
        catch (error) {
            console.log(error);
            throw "An internal error occurred.";
        }
        return path;
    }
}