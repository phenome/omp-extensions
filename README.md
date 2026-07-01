# Ponytail Caveman

Ponytail + Caveman extension for [Oh My Pi](https://github.com/can1357/oh-my-pi).

## Install

Install from npm:

```sh
omp plugin install omp-ponytail-caveman
```

GitHub installs still work for unreleased commits:

```sh
omp plugin install github:phenome/omp-ponytail-caveman
```

Local development:

```sh
omp plugin link /path/to/omp-ponytail-caveman
```

Restart Oh My Pi after installing.

**Plugin** — OMP reads `package.json` (`omp.extensions`) and loads `omp-ponytail-caveman` automatically.

**Detached skills are mandatory.** The plugin reads Ponytail and Caveman from global `skills` CLI installs; it does not vendor them. `postinstall` tries to install or refresh them, but dependency lifecycle scripts may be blocked. If skills are missing or stale, run either command:

```sh
/ponytail install-skills
/caveman install-skills
```

Both commands refresh both upstream skill sets.

## Plugin

### omp-ponytail-caveman

Composes Ponytail and Caveman into one `before_agent_start` hook. Oh My Pi keeps only the first hook message returned, so both instruction blocks must be injected by one plugin.

Runtime commands:

- `/ponytail` or `/ponytail status` — show status and help.
- `/ponytail on|off` — enable Ponytail at the remembered mode, or disable it for this session.
- `/ponytail lite|full|ultra` — enable Ponytail at that mode for this session.
- `/ponytail global on|off|lite|full|ultra` — write global config and apply it to this session.
- `/ponytail repo on|off|lite|full|ultra` — write repo config and apply it to this session.
- `/ponytail install-skills` — refresh Ponytail and Caveman skill installs.
- `/caveman` or `/caveman status` — show status and help.
- `/caveman on|off` — enable Caveman at the remembered mode, or disable it for this session.
- `/caveman lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra` — enable Caveman at that mode for this session.
- `/caveman global on|off|lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra` — write global config and apply it to this session.
- `/caveman repo on|off|lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra` — write repo config and apply it to this session.
- `/caveman install-skills` — refresh Ponytail and Caveman skill installs.

Commands expose static completions for known arguments.

#### Configuration

Config file name stays `ponytail-caveman.json`.

Example global or repo-local file:

```json
{
  "ponytail": {
    "enabled": true,
    "mode": "full"
  },
  "caveman": {
    "enabled": true,
    "mode": "ultra"
  }
}
```

Ponytail modes: `lite`, `full`, `ultra`. Caveman modes: `lite`, `full`, `ultra`, `wenyan-lite`, `wenyan-full`, `wenyan-ultra`. `off` is stored as `enabled: false`, not as a mode.

Effective config merges by field, highest wins:

1. Session command state.
2. Repo config: nearest Git root `.omp/ponytail-caveman.json`; if no Git root, current working directory `.omp/ponytail-caveman.json`.
3. Global OMP config: `~/.omp/agent/ponytail-caveman.json`, or `~/.omp/profiles/<profile>/agent/ponytail-caveman.json` when `OMP_PROFILE` / `PI_PROFILE` is set.
4. Built-ins.

There are no environment variable overrides.

Detached skill sources:

- Ponytail: `skills add DietrichGebert/ponytail -g --skill '*' -y`
- Caveman: `skills add https://github.com/juliusbrussee/caveman -g --skill caveman -y`

If an enabled skill is missing, the widget and status output report it. The extension does not inject fallback instructions.

## Uninstall

```sh
omp plugin uninstall omp-ponytail-caveman
```

## Updating

For npm installs:

```sh
omp plugin uninstall omp-ponytail-caveman
omp plugin install omp-ponytail-caveman
```

For GitHub installs, clean reinstall is the reliable update path because the plugin manager may keep the existing Bun git checkout:

```sh
omp plugin uninstall omp-ponytail-caveman
omp plugin install github:phenome/omp-ponytail-caveman
```

Restart Oh My Pi after updating.

To refresh detached skills:

```sh
/ponytail install-skills
# or
/caveman install-skills
```

## Publishing

Manual first publish:

```sh
npm login
npm run smoke
npm pack --dry-run
npm publish
```

Publish package name is unscoped: `omp-ponytail-caveman`.
