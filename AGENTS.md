# Communication

- **Be concise and direct.** Prioritize actionable guidance over verbose narration. Use structured formatting (headers, tables) only when it genuinely improves scannability.
- **Be accurate and truthful.** Ground claims in the provided codebase, tool results, or reliable external resources. Do not fabricate details.
- **Prioritize technical correctness.** If a user assumption is flawed or a requested approach is risky, explicitly state the problem and explain your reasoning.
- **Never guess or assume.** If requirements, technical details, or user intent are ambiguous or missing, you must stop and ask specific clarifying questions. Only proceed once you have the necessary context. 
- **Be transparent about limitations.** Label inferences clearly. If you cannot verify something, state what you would check next.
- **Do not over-apologize.** If results are unexpected or an error occurs, briefly state what happened and immediately provide the next best step.

# Code Documentation and Commenting Requirements

Whenever you write, modify, or review code, you must strictly adhere to the following documentation rules:

1. **Mandatory Structural Documentation:** Write standard, idiomatic documentation (e.g., GoDoc, docstrings, JSDoc) for all functions, structs, classes, interfaces, and modules. Explain the purpose, parameters, and return values.
2. **Contextual Inline Comments:** Explain *why* a decision was made, not *what* the syntax does. Document complex logic and edge-case handling.
3. **Third-Party APIs:** Always document the intended behavior and purpose of third-party API calls, assuming the reader has no prior context on the external library.
4. **Strict Maintenance:** If you modify existing code, you must update its corresponding structural documentation and inline comments to guarantee perfect accuracy. Never leave stale or orphaned comments.

# Refactoring and Breaking Changes

- **Prioritize Architecture Over Compatibility:** Unless explicitly instructed otherwise, introduce breaking changes if they result in cleaner, more idiomatic, and more maintainable code. Do not write suboptimal workarounds just to preserve existing signatures or data structures.
- **Update Callers:** When introducing a breaking change, you are responsible for updating all affected call sites within the provided context. 
- **Identify Out-of-Scope Impacts:** If your breaking change affects call sites or files that have not been provided in the prompt, explicitly list the files or components the user needs to provide or update.

# Performance and Data-Oriented Design

When writing or refactoring performance-critical code, prioritize memory access patterns and CPU cache efficiency over theoretical algorithmic complexity. 

- **Design for the Cache Line:** CPUs fetch main memory in 64-byte chunks. A cache miss (fetching from RAM) costs hundreds of CPU cycles, whereas reading from the L1 cache costs only a few. Structure data so sequential operations read contiguous memory blocks.
- **Prefer Contiguous Data:** Default to flat arrays of structs (value types) rather than arrays of objects/pointers (reference types). Arrays of pointers fragment memory, causing cache misses on iteration.
- **Optimize Memory Alignment:** Declare variables inside structs/classes from largest to smallest (e.g., 8-byte integers first, 1-byte booleans last). This minimizes memory padding waste and fits more items into a single cache line.
- **Process in Bulk:** Avoid object-oriented "tick" or "update" methods that operate on a single instance at a time. Write functions that take arrays or slices of data and process them in bulk.
- **Avoid Last-Minute Decisions:** Eliminate branches (`if/else`) inside hot loops. Instead of iterating through a mixed collection and branching based on state, split the data into separate arrays by state and process each array uniformly.
- **Take Information Out of Band:** When splitting data into state-specific arrays, use the array membership itself to imply state. (e.g., If an entity is in the `dead_enemies` array, you do not need an `is_dead` boolean on the struct).
- **Use Minimal Data Types:** Pack data tightly. Use 8-bit integers or byte-backed enums instead of 32-bit integers or multiple loose booleans. Avoid strings for IDs or frequently compared variables; always use integer IDs or enums.
- **Relax Unnecessary Constraints:** Do not pay for guarantees you don't need. If the order of an array doesn't matter, avoid O(N) array deletions that shift elements. Instead, use an O(1) "swap and pop" (move the last element into the deleted spot and shrink the array size).
- **Pre-Compute and Hoist:** Lift unchanging variables (invariants) out of loops. If an operation can be pre-computed, baked at initialization, or done ahead of time, do not execute it at runtime.
- **Avoid Unmanaged Callbacks in Hot Paths:** Function pointers, delegates, and observer patterns obscure the performance cost of a loop. Keep logic inline for performance-critical batch processing.

# "Clean Code" Performance Traps

Do not prioritize theoretical maintainability over raw hardware efficiency. Applying dogma from clean code evangelists blindly erases decades of hardware evolution. In performance-critical paths, you must abandon these rules.

- **Reject Forced Polymorphism:** Virtual functions and class hierarchies introduce pointless pointer indirection and hide your logic from the compiler. Rip them out. Use standard switch statements, enums, and unions instead. A basic switch over a union type easily beats virtual dispatch by feeding the compiler exactly what it needs to optimize.
- **Violate Data Hiding:** Treating internals as black boxes guarantees horrible performance. Functions absolutely must exploit the internal structure of the data they process. Organize your architecture by function, not by isolating everything into fractured class files.
- **Drive Logic with Tables:** When you organize by function, patterns across your data become obvious. Exploit this by replacing switch statements with flat lookup tables. Fusing the data model with the code instantly drops cycle counts and yields massive, 10x-15x speed multipliers.
- **Don't Worship D.R.Y.:** "Don't Repeat Yourself" is fine for standard boilerplate, but it becomes a liability if it gets in the way of hardware utilization. If building redundant, specialized tables unlocks SIMD/AVX instructions or tighter cache packing, duplicate the data. Never trade execution speed for a smaller source file.

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
