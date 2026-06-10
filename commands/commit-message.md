---
description: Generate conventional commit message(s) from staged changes
agent: plan
model: openai/gpt-5.4-mini
---

Review the current Git staged changes and produce one or more clear, high-quality commit message(s) for those changes.

Required steps:

- Inspect staged files and diffs (e.g. run `git diff --staged --name-only` and `git diff --staged`).
- Group changes into logical commits. If changes are unrelated, produce multiple commit messages (one per logical change). If they belong together, produce a single commit message.
- Follow the Conventional Commits format for each message:
  - Header: type(scope?): short summary
    - type: feat, fix, docs, style, refactor, perf, test, chore, ci, build
    - Keep the subject in imperative mood, <= 50 characters, no trailing period.
  - Body (optional): explain what changed and why. Wrap at ~72 characters.
  - Footer (optional): include `BREAKING CHANGE:` or issue references like `Fixes #123`.

Output rules:

- If a single commit is appropriate: output ONLY the commit message text (header, blank line, body, optional footer). Do NOT include file lists, diff excerpts, or extra commentary.
- If multiple commits are appropriate: output each commit message separated by a single line containing three hyphens (`---`). Each commit must follow the format above. Do NOT include extra commentary.
- If context is unclear: include a one-line note beginning with `NOTE:` describing what you couldn't determine, followed by the commit message(s).

Examples:

feat(auth): add token refresh on 401
Automatically refresh auth tokens when a 401 response is received to
prevent repeated failed requests and improve user experience.
Fixes #42

fix(api): validate response before accessing properties
Ensure the API handler checks for null/undefined responses before
accessing properties to avoid runtime exceptions in edge cases.

When ready, inspect the staged changes and generate the commit message(s) following the rules above.
