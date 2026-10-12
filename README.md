# opencode

This repository contains my configuration for the OpenCode coding agent.

## OpenCode V2

This is the global configuration at `~/.config/opencode`, migrated to native V2.
Use OpenCode V2, not V1, with these files.

- `opencode.jsonc`: models, updates, ordered permissions, and MCP servers.
- `cli.json`: terminal preferences; V2 no longer reads `tui.json`.
- `agents/`, `commands/`, and `skills/`: globally discovered definitions.
- `plugins/cbm-augment.ts`: the locally maintained V2 codebase-memory plugin.
- `AGENTS.md`: shared instructions, unchanged by migration.

Install the pinned plugin dependency with `npm ci`. Run its isolated regression
tests with `npm test` using Node.js 22.18 or newer.

The MCP executable remains `/Users/fepozopo/.local/bin/codebase-memory-mcp`.
The plugin adds graph routing before model requests (including after compaction),
search hints after grep/glob, and coverage notes after reads. Its generator markers
were removed deliberately to retain this V2 port across codebase-memory updates.
The graph agents permit Code Mode, whose nested MCP calls retain their read-only
allowlists; MCP mutations, shell commands, and further delegation remain denied.

`compaction.prune` was removed because V2 ignores it. Automatic compaction remains
enabled. The existing `cli.json` preferences were preserved, and `tui.json` remains
only as a V1 reference. `service.json` is machine-local and was not modified.

The `commit-message` command still selects `openai/gpt-5.4-mini`. This model was
not listed by the configured provider during migration verification; the selection
was left unchanged rather than silently substituting a different model.

Verify without generating model output:

```sh
opencode debug config
opencode debug agents
opencode api plugin.list --param 'location[directory]=/Users/fepozopo/.config/opencode'
opencode api mcp.list --param 'location[directory]=/Users/fepozopo/.config/opencode'
```

V2 watches these configuration directories and reloads changes automatically.
If an unwatched dependency update is not picked up, run `opencode service restart`
when no other work is active.

Migration reference: <https://opencode.ai/v2/docs/migrate-v1/>.
