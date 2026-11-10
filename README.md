# amp-last-reply-time-plugin

An [Amp](https://ampcode.com) plugin that shows when the agent last replied as a button above the composer of each thread, e.g. `Last reply 3:42 PM` (or `Last reply Nov 3, 3:42 PM` on an earlier day). Click it to copy that reply. Works in the macOS app.

- Thread messages carry no reliable timestamps, so the plugin records the time at the end of each turn. Those times are saved under `~/.cache/amp/plugin-cache/`, so they survive reloads and restarts.
- A thread shows the button only after the plugin has seen one of its turns end.

## Install

Clone the repo and symlink the plugin into your system plugins directory, so `git pull` updates it:

```sh
git clone https://github.com/paulstraw/amp-last-reply-time-plugin.git
cd amp-last-reply-time-plugin
mkdir -p ~/.config/amp/plugins
ln -s "$PWD/last-reply-time.ts" ~/.config/amp/plugins/last-reply-time.ts
```

Or download just the file:

```sh
mkdir -p ~/.config/amp/plugins
curl -fsSL https://raw.githubusercontent.com/paulstraw/amp-last-reply-time-plugin/main/last-reply-time.ts \
  -o ~/.config/amp/plugins/last-reply-time.ts
```

Then run **plugins: reload** from the command palette (⌘K). No dependencies: Amp runs plugins with Bun, and this is a single file.

To uninstall, delete `~/.config/amp/plugins/last-reply-time.ts` and reload plugins.

## License

[MIT](LICENSE)
