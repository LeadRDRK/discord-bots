# Obama Coin
Requirements:
- node.js v12 or later
- npm v7 or later
- ImageMagick (must be in PATH)
- (Optional) Linux-compatible environment with glibc 2.4 or later, and libreadline7 (must be version 7, or you'll need to recompile `lua`). Some commands will break on other OSes due to dependence on Linux executables. On Windows, this could be achieved using msys2 or WSL2.
- (Optional) Reddit API access (for reddit commands)

Setup:
- Run `npm install` to install the dependencies.
- Check `index.js` and add your bot's token on line 197.
- (Optional) Add your discord ID (not tag/username) on line 117.
- (Optional) Add your reddit API credentials in `commands/utils/randomReddit.js`

Run:
- Use `node index.js` to start the bot.

Heroku setup:
- Depends on these buildpacks:
1. `https://buildpack-registry.s3.amazonaws.com/buildpacks/heroku-community/apt.tgz`
2. `heroku/nodejs`
3. `https://github.com/DuckyTeam/heroku-buildpack-imagemagick`
- Modify the URL on line 217 in `index.js` if you need it to stay alive on a free dyno.