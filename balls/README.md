# Balls v2
Requirements:
- node.js v16 or later
- npm v8.2 or later
- Unix-like environment. Will not run natively on Windows! (you can still use msys2 or WSL2)
- GNU make and a C compiler (gcc, clang, etc.)

Setup:
- Run `npm install` to install the dependencies.
- Check `src/Bot.ts` and write in the required credentials.
- Run `npm run build` to compile the TypeScript code and C executables.

Run:
- Use `npm run start` to start the bot.
- Default prefix is `=`, test mode uses `+` instead.

Heroku setup:
- Modify herokuOrigin in `src/index.ts` if you need it to stay alive on a free dyno.

Extras:
- Run `npm run docgen` to generate the commands' documentation.
- Run `npm run devstart` to quickly compile TS and run the bot. Useful for development.
- Supported environment variables:
    - `PORT`: Which port to run the dummy HTTP server.
    - `TEST`: Set to 1 to enable test mode (which uses the testToken instead)
- The 3D renderer that has yet to be integrated into balls is also available in this folder and [its own repository](https://github.com/LeadRDRK/LESSR), which is still being maintained.