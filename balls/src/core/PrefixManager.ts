import { EnvOptions } from "./EnvOptions";

// TODO: Change back to "-"
const DEFAULT_PREFIX = EnvOptions.isEnabled("TEST") ? "+" : "=";

function init(): boolean {
    // TODO
    return true;
}

function getPrefix(guildId: string): string {
    // TODO
    return DEFAULT_PREFIX;
}

const PrefixManager = {
    init,
    getPrefix
}

export { PrefixManager };