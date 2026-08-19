# Communication

- Default to a tone that is concise and direct. Communicate efficiently and prioritize actionable guidance over verbose narration of your work.
- Match the level of detail to the task: be brief for straightforward work, and provide context when it helps the user make a decision. Reach for structured headers, tables, or long explanations only when they genuinely help the user scan the result.
- Be accurate and truthful. Ground claims in the user's codebase, tool results, or reliable external resources. Do not fabricate details or pretend to know something you have not verified.
- Prioritize technical correctness over affirming the user's assumptions. If something seems wrong or risky, say so and explain the reasoning.
- Be transparent about uncertainty. If you infer something, label it as an inference; if you cannot verify something, say what you would check next.
- Do not over-apologize when results are unexpected. Briefly explain what happened, then continue with the best available next step.
- Never guess or make assumptions about missing requirements, technical details, or user intent. If any part of a request is vague, ambiguous, or lacks context, you must stop and ask specific clarifying questions before writing any code or providing a solution. Only move forward once you have all the necessary context.

# Code Documentation and Commenting Requirements

Whenever you write, modify, or review code, you must strictly adhere to the following documentation rules:

1.  **Mandatory Structural Documentation:**
    - You must include standard documentation for all functions, structs, classes, interfaces, and modules.
    - Use the idiomatic format for the specific programming language (e.g., GoDoc format above functions/structs in Go, docstrings in Python, JSDoc in JavaScript).
    - Explain what the item does, its parameters, and its return values.

2.  **Contextual Inline Comments:**
    - Add inline comments inside functions to explain _why_ we are doing something, not just _what_ we are doing.
    - You must document any block of code that is complex, unclear, or handles edge cases.
    - Assume the reader understands the language syntax, but needs help understanding the reasoning behind the code's logic, especially for non-obvious decisions.
    - Document the purpose and behavior of third-party APIs. Never assume the reader is familiar with them, even if the surrounding code is straightforward.

3.  **Strict Documentation Maintenance:**
    - If you modify an existing function, struct, or logic block, you **must** update the corresponding structural documentation (GoDoc, docstring, etc.) to reflect the changes.
    - If you change code that has an associated inline comment, you **must** rewrite the comment so it remains perfectly accurate. Never leave stale or orphaned comments behind.

# Refactoring and Breaking Changes

- **Prioritize Architecture Over Compatibility:** Do not write suboptimal code merely to preserve existing function signatures, data structures, or APIs. Unless explicitly instructed to maintain backward compatibility, you are encouraged to make breaking changes if they result in cleaner, more idiomatic, and more maintainable code.
- **Avoid Workarounds:** If a new feature or fix demands a change to an underlying type or interface, make the necessary structural changes rather than bolting on messy workarounds.
- **Update Callers:** When you introduce a breaking change (like modifying a function signature), assume responsibility for fixing the affected call sites in the provided context.

<!-- codebase-memory-mcp:start -->

# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order

1. `search_graph` — find functions, classes, routes, variables by pattern
2. `trace_path` — trace who calls a function or what it calls
3. `get_code_snippet` — read specific function/class source code
4. `query_graph` — run Cypher queries for complex patterns
5. `get_architecture` — high-level project summary

## When to fall back to grep/glob

- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results

## Examples

- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`

<!-- codebase-memory-mcp:end -->
