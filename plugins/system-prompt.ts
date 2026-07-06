import type { Hooks, Plugin } from "@opencode-ai/plugin";

let latestSystemPrompt = "";

/**
 * Writes the latest system prompt to `system-prompt.md` in the active directory,
 * and refreshes the snapshot again when `dump prompt` runs.
 *
 * @param context Plugin context containing the current directory.
 * @returns Plugin hooks that persist the transformed system prompt to disk.
 */
export const SystemPrompt: Plugin = async (context) => {
    const { $, directory } = context;

    return {
        "experimental.chat.system.transform": async (_input, output) => {
            const message =
                output.system.map((prompt) => `\n${prompt}`).join("\n-----") ||
                "";
            latestSystemPrompt = message;

            // Overwrite a single file so the current prompt is always easy to find.
            await $`cd ${directory} && printf %s ${message} > system-prompt.md`;
        },
        "command.execute.before": async (input) => {
            if (input.command !== "system-prompt") {
                return;
            }

            if (!latestSystemPrompt) {
                return;
            }

            // Re-write the last known prompt when /status is used so the file stays current.
            await $`cd ${directory} && printf %s ${latestSystemPrompt} > system-prompt.md`;
        },
    } as Hooks;
};
