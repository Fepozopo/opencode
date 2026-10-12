/**
 * Adds codebase-memory routing, search hints, and read-coverage notes to V2.
 * This locally maintained port intentionally omits the generator's markers
 * so codebase-memory updates do not replace it with a V1 implementation.
 */
import { spawn } from 'node:child_process';
import { Plugin } from '@opencode/plugin';

const BIN = '/Users/fepozopo/.local/bin/codebase-memory-mcp';

/**
 * Runs the MCP server's hook adapter without interrupting work on failure.
 * @param payload Hook event, input, and the session's working directory.
 * @returns Additional context, or an empty string if the adapter fails.
 */
function augment(payload: Record<string, unknown>): Promise<string> {
  return new Promise<string>((resolve) => {
    const child = spawn(BIN, ['hook-augment'], {
      stdio: ['pipe', 'pipe', 'ignore'],
      env: { ...process.env, CBM_LOG_LEVEL: 'error' },
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.on('error', () => resolve(''));
    // An unavailable adapter can close stdin before the payload is written.
    child.stdin.on('error', () => resolve(''));
    child.on('close', () => {
      try {
        const ctx = JSON.parse(out)?.hookSpecificOutput?.additionalContext;
        resolve(typeof ctx === 'string' ? ctx : '');
      } catch { resolve(''); }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

export default Plugin.define({
  id: 'codebase-memory.augment',
  /**
   * Registers V2 hooks; OpenCode disposes the registrations on plugin unload.
   * @param ctx OpenCode's plugin context and session client.
   * @returns Resolves after all hooks have been registered.
   */
  async setup(ctx) {
    // V2 context hooks run before each model request, including after compaction.
    // Reinject routing here rather than relying on a persisted tool result.
    await ctx.session.hook('context', async (event) => {
      // A session can move away from the location where the plugin was loaded.
      const session = await ctx.session.get({ sessionID: event.sessionID });
      const note = await augment({
        hook_event_name: 'SessionStart',
        cwd: session.location.directory,
      });
      if (note) event.system.push({ type: 'text', text: note });
    });

    // V2 exposes structured results, not V1's mutable output.output string.
    await ctx.tool.hook('execute.after', async (event) => {
      if (event.status !== 'completed') return;
      const args = event.input as Record<string, unknown> | null | undefined;
      const search =
        event.tool === 'grep' ? 'Grep' : event.tool === 'glob' ? 'Glob' : null;
      const filePath = args?.filePath ?? args?.file_path ?? args?.path;
      if (!search && (event.tool !== 'read' || typeof filePath !== 'string' || !filePath)) return;

      // Fetch the current session location so hints refer to the right graph.
      const session = await ctx.session.get({ sessionID: event.sessionID });
      let note: string;
      if (search) {
        note = await augment({
          hook_event_name: 'PreToolUse',
          tool_name: search,
          tool_input: args,
          cwd: session.location.directory,
        });
      } else {
        note = await augment({
          hook_event_name: 'PostToolUse',
          tool_name: 'Read',
          tool_input: { file_path: filePath },
          cwd: session.location.directory,
        });
      }
      if (!note) return;
      const content = event.result.content;
      event.result = {
        ...event.result,
        content: typeof content === 'string'
          ? content + '\n' + note
          : [...(content ?? []), { type: 'text', text: note }],
      };
    });
  },
});
