# OMP Extensions

Small user-level extensions for [Oh My Pi](https://github.com/can1357/oh-my-pi).

## How to install

Primary route:

```sh
omp plugin install github:phenome/omp-extensions
```

Restart Oh My Pi after installing.

**Extension** — OMP reads the plugin manifest in `package.json` (`omp.extensions`) and loads bundled extensions automatically. No manual copying into an extensions folder.

**Detached skills** — Ponytail and Caveman run as separate global skills (installed via the `skills` CLI). They are ensured automatically:

1. **Postinstall** — When lifecycle scripts run, `postinstall` executes `scripts/install-ponytail-caveman.mjs` (`bunx` when available, otherwise `npx -y`).
2. **Runtime bootstrap** — On first OMP startup, the extension checks for missing skills and runs the same install script if needed.

If lifecycle scripts are disabled (for example `--ignore-scripts`), run the installer manually from the plugin directory:

```sh
node scripts/install-ponytail-caveman.mjs
```

Future extensions in this package follow the same pattern: install via `omp plugin install`, optional postinstall setup for external dependencies.

## Extensions

### ponytail-caveman

Composes Ponytail and Caveman into one `before_agent_start` hook. Oh My Pi keeps only the first hook message returned, so both instruction blocks must be injected by one extension.

Runtime commands:

- `/ponytail` — enable Ponytail at the configured default mode.
- `/ponytail status` — show current Ponytail mode and default.
- `/ponytail default` — show configured Ponytail default.
- `/ponytail default lite|full|ultra|off` — set Ponytail default.
- `/ponytail lite|full|ultra|off` — set current Ponytail mode.
- `/caveman` or `/caveman status` — show Caveman ultra state.
- `/caveman on|off` — enable or disable Caveman ultra injection.
- `/caveman default` — show configured Caveman default.
- `/caveman default on|off` — set Caveman default.

#### Configuration

Defaults resolve in this order (lowest → highest):

1. **Built-ins** — Ponytail `full`, Caveman enabled.
2. **Global OMP config** — `~/.omp/agent/ponytail-caveman.json`, or `~/.omp/profiles/<profile>/agent/ponytail-caveman.json` when `OMP_PROFILE` / `PI_PROFILE` is set.
3. **Nearest repo-local OMP config** — `<repo>/.omp/ponytail-caveman.json` (walks up from the current working directory).
4. **Environment variables** — `PONYTAIL_DEFAULT_MODE`, `CAVEMAN_DEFAULT_ENABLED`.
5. **Current session command state** — `/ponytail lite|full|ultra|off` and `/caveman on|off` (session-only; not written to disk).

Example global or repo-local file:

```json
{
  "ponytail": {
    "defaultMode": "ultra"
  },
  "caveman": {
    "enabled": true
  }
}
```

Environment variables override JSON defaults for new sessions:

| Variable | Values | Effect |
|----------|--------|--------|
| `PONYTAIL_DEFAULT_MODE` | `lite`, `full`, `ultra`, `off` | Default Ponytail mode |
| `CAVEMAN_DEFAULT_ENABLED` | `true` / `false`, `on` / `off`, `1` / `0` | Default Caveman injection |

`/ponytail default <mode>` and `/caveman default on|off` persist defaults to the **global** OMP config file only (`~/.omp/agent/ponytail-caveman.json`, or the matching profile path). They never write `<repo>/.omp/ponytail-caveman.json`; edit repo-local files manually for per-project defaults.

Detached skill sources:

- Ponytail: `skills add DietrichGebert/ponytail -g --skill '*' -y`
- Caveman: `skills add https://github.com/juliusbrussee/caveman -g --skill caveman -y`

The postinstall script runs those through `bunx` or `npx -y`. The extension reads installed skills from `~/.agents/skills/<name>/SKILL.md`, so future skill updates remain managed by the `skills` CLI.

## Updating

For GitHub installs, clean reinstall is the reliable update path because the plugin manager has no dedicated update command and repeated installs may keep the existing Bun git checkout:

```sh
omp plugin uninstall omp-extensions
omp plugin install github:phenome/omp-extensions
```

Restart Oh My Pi after updating.

To refresh detached skills directly, use your available runner:

```sh
bunx skills update -g
# or
npx -y skills update -g
```
