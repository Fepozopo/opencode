/** Regression tests for the V2 plugin's model context and tool-result hooks. */
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { EventEmitter } from 'node:events';
import { syncBuiltinESMExports } from 'node:module';
import { PassThrough, Writable } from 'node:stream';
import { test } from 'node:test';
import plugin from '../plugins/cbm-augment.ts';

/**
 * Sets up the public plugin with fake session and subprocess boundaries.
 * @param {import('node:test').TestContext} t Owns mock teardown.
 * @param {object} options Adapter response and current session directory.
 * @returns Hook callbacks and captured adapter payloads, without network or disk IO.
 */
async function setupPlugin(t, {
  response = JSON.stringify({ hookSpecificOutput: { additionalContext: 'graph note' } }),
  sessionDirectory = '/workspace/moved',
  spawnError = false,
} = {}) {
  const payloads = [];
  const spawn = t.mock.method(childProcess, 'spawn', () => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stdin = new Writable({
      /** Collects one hook payload and deterministically finishes the fake child. */
      write(chunk, _encoding, callback) {
        payloads.push(JSON.parse(chunk.toString()));
        if (spawnError) {
          queueMicrotask(() => child.emit('error', Object.assign(new Error('missing adapter'), { code: 'ENOENT' })));
        } else {
          child.stdout.end(response);
          queueMicrotask(() => child.emit('close', 0));
        }
        callback();
      },
    });
    return child;
  });
  // Node's named built-in imports must observe the fake and its restoration.
  syncBuiltinESMExports();
  t.after(() => {
    spawn.mock.restore();
    syncBuiltinESMExports();
  });

  const hooks = {};
  await plugin.setup({
    location: { directory: '/workspace/original' },
    session: {
      /** Returns the session's location, which may differ from the plugin location. */
      async get() { return { location: { directory: sessionDirectory } }; },
      /** Captures registrations on the public session hook API. */
      async hook(name, callback) { hooks[name] = callback; },
    },
    tool: {
      /** Captures registrations on the public tool hook API. */
      async hook(name, callback) { hooks[name] = callback; },
    },
  });
  return { hooks, payloads };
}

test('routing is added to fresh model context on every request, including after compaction', async (t) => {
  const { hooks, payloads } = await setupPlugin(t);
  for (const phase of ['initial request', 'tool continuation', 'after compaction']) {
    const event = { sessionID: 'ses_test', system: [{ type: 'text', text: 'existing instructions' }] };
    await hooks.context(event);
    assert.deepEqual(event.system, [
      { type: 'text', text: 'existing instructions' },
      { type: 'text', text: 'graph note' },
    ], `expected preserved instructions and routing for ${phase}`);
  }
  assert.deepEqual(payloads, Array.from({ length: 3 }, () => ({
    hook_event_name: 'SessionStart', cwd: '/workspace/moved',
  })), 'expected routing to use the current session directory on every request');
});

for (const [tool, input, adapterInput] of [
  ['grep', { pattern: 'Handler' }, { hook_event_name: 'PreToolUse', tool_name: 'Grep', tool_input: { pattern: 'Handler' } }],
  ['glob', { pattern: '**/*.go' }, { hook_event_name: 'PreToolUse', tool_name: 'Glob', tool_input: { pattern: '**/*.go' } }],
  ['read', { path: 'src/main.go' }, { hook_event_name: 'PostToolUse', tool_name: 'Read', tool_input: { file_path: 'src/main.go' } }],
]) {
  test(`${tool} appends adapter context without losing output or metadata`, async (t) => {
    const { hooks, payloads } = await setupPlugin(t);
    const event = {
      tool, input, sessionID: 'ses_test', status: 'completed',
      result: { content: 'original result', output: { count: 2 }, metadata: { retained: true } },
    };
    await hooks['execute.after'](event);
    assert.deepEqual(event.result, {
      content: 'original result\ngraph note', output: { count: 2 }, metadata: { retained: true },
    }, `expected ${tool} output and metadata to survive augmentation`);
    assert.deepEqual(payloads, [{ ...adapterInput, cwd: '/workspace/moved' }],
      `expected ${tool} adapter payload to use the session's current directory`);
  });
}

for (const [name, content] of [
  ['structured files', [{ type: 'file', uri: 'file:///workspace/image.png', mime: 'image/png' }]],
  ['empty array', []],
  ['absent content', undefined],
]) {
  test(`read preserves ${name} when adding a text note`, async (t) => {
    const { hooks } = await setupPlugin(t);
    const event = {
      tool: 'read', input: { path: 'image.png' }, sessionID: 'ses_test', status: 'completed', result: { content },
    };
    await hooks['execute.after'](event);
    assert.deepEqual(event.result.content, [...(content ?? []), { type: 'text', text: 'graph note' }],
      `expected ${name} to be retained alongside the coverage note`);
  });
}

for (const [name, options] of [
  ['missing executable', { spawnError: true }],
  ['malformed JSON', { response: 'not JSON' }],
  ['missing context', { response: '{}' }],
  ['non-string context', { response: '{"hookSpecificOutput":{"additionalContext":42}}' }],
]) {
  test(`${name} leaves the original tool result untouched`, async (t) => {
    const { hooks } = await setupPlugin(t, options);
    const result = { content: 'original result' };
    const event = { tool: 'read', input: { path: 'main.go' }, sessionID: 'ses_test', status: 'completed', result };
    await hooks['execute.after'](event);
    assert.strictEqual(event.result, result, `expected the original result for ${name}`);
    assert.deepEqual(result, { content: 'original result' }, `expected no output changes for ${name}`);
  });
}

for (const [name, event] of [
  ['tool failure', { tool: 'read', status: 'error', error: { message: 'unreadable' } }],
  ['unrelated tool', { tool: 'shell', status: 'completed', input: { command: 'pwd' }, result: {} }],
  ['null read input', { tool: 'read', status: 'completed', input: null, result: {} }],
  ['empty read path', { tool: 'read', status: 'completed', input: { path: '' }, result: {} }],
]) {
  test(`${name} does not invoke the adapter`, async (t) => {
    const { hooks, payloads } = await setupPlugin(t);
    const original = structuredClone(event);
    await hooks['execute.after'](event);
    assert.deepEqual(payloads, [], `expected no adapter payload for ${name}`);
    assert.deepEqual(event, original, `expected no event changes for ${name}`);
  });
}
