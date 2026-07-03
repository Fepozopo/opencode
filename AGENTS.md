### Code Documentation and Commenting Requirements

Whenever you write, modify, or review code, you must strictly adhere to the following documentation rules:

1.  **Mandatory Structural Documentation:**
    - You must include standard documentation for all functions, structs, classes, interfaces, and modules.
    - Use the idiomatic format for the specific programming language (e.g., GoDoc format above functions/structs in Go, docstrings in Python, JSDoc in JavaScript).
    - Explain what the item does, its parameters, and its return values.

2.  **Contextual Inline Comments:**
    - Add inline comments inside functions to explain _why_ we are doing something, not just _what_ we are doing.
    - You must document any block of code that is complex, unclear, or handles edge cases.
    - Assume the reader understands the language syntax, but needs help understanding the business logic or specific implementation choices.

3.  **Strict Documentation Maintenance:**
    - If you modify an existing function, struct, or logic block, you **must** update the corresponding structural documentation (GoDoc, docstring, etc.) to reflect the changes.
    - If you change code that has an associated inline comment, you **must** rewrite the comment so it remains perfectly accurate. Never leave stale or orphaned comments behind.

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
