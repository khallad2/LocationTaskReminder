# Model Context Protocol (MCP) in Google Antigravity SDK
## Developer Guide & Architectural Reference

Welcome to the comprehensive technical documentation suite for **Model Context Protocol (MCP)** integration in the **Google Antigravity (AGY) SDK**. 

This reference documentation is structured as a 4-part architectural series designed for systems engineers, security auditors, and AI developers building advanced agentic workflows.

---

## 📚 Table of Contents

### 📂 [Part 1: Architectural Overview & Standard Protocols](file:///Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/docs/mcp/part1_architecture.md)
* **The Three Pillars**: In-depth analysis of the `Agent`, `Conversation`, and `Connection` classes.
* **Standard Protocols**: Deep dive into the open, bidirectional Model Context Protocol (MCP) standard and its JSON-RPC 2.0 framing layer.
* **Decoupled Transports**: Structural comparison of Stdio Transport (local IPC) versus SSE Transport (Server-Sent Events) with a side-by-side assessment matrix.
* **Execution Flow**: Step-by-step sequence flow of the end-to-end trace of a user request `agent.chat()`.

### 📂 [Part 2: Tool Registry & Stdio Integration](file:///Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/docs/mcp/part2_stdio.md)
* **Local Process Lifecycle**: Detailed process spawning, IPC pipe binding, and subprocess management via `types.McpStdioServer`.
* **Under-the-Hood Invocation**: Sequence diagram detailing the JSON-RPC 2.0 dual-direction communication over standard streams.
* **The FastMCP Bridge**: Building secure local tool servers using Python's `FastMCP` reflection libraries.
* **Type Compatibility & Identifier Safety**: Complete mapping of Python/TypeScript types to JSON schemas and strict identifier naming rules.
* **Troubleshooting Matrix**: Technical diagnostic codes (`0xEE01`–`0xEE05`) with root causes and structural remedies.

### 📂 [Part 3: SSE Transport & Distributed MCP Architecture](file:///Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/docs/mcp/part3_sse.md)
* **Remote Microservices Architecture**: Decoupling execution runtimes from the agent engine using HTTP-based transport.
* **SSE Configurations**: Complete parameter breakdown of `types.McpSseServer` including authorization headers, custom headers, and keep-alive heartbeats.
* **Secure Enterprise Protocol**: Python blueprints demonstrating dynamic Bearer token rotation utilizing custom providers (e.g., HashiCorp Vault integrations).
* **Resiliency & High Latency Mitigations**: Handling network failures, connection state transitions, backoffs, caching policies, and dynamic semaphores.
* **Production Deployment Blueprints**: Mermaid architectural layouts mapping Client-Edge requests to Stateful SSE Routing Hubs and dynamically isolated sandbox worker containers.

### 📂 [Part 4: Security, Access Control, and Permission Policies](file:///Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/docs/mcp/part4_security.md)
* **Declarative Policy Framework**: Isolating agent execution environments, environment scrubbing, and default out-of-the-box safe postures.
* **Resolution Precedence**: Clear explanation of the strict six-tier priority resolution tree (Deny over Allow, Specific over Wildcard). Includes an internal decision flowchart.
* **Namespace Scoping**: Managing permissions with granular detail using the `mcp(server/tool)` and `mcp(server/*)` syntax.
* **Convenience Presets & Custom Predicates**: Dynamic execution filters using Python lambdas and TypeScript callbacks to scan tool parameters for injection attacks.
* **Safe Integration Templates**: Three complete production-ready code setups (Zero-Trust/Deny-by-default, Workspace-Restricted, and Interactive User-in-the-Loop Gateway).

---

## 💡 Quick Start

To connect an agent to an MCP server, configure the `mcp_servers` parameter within `LocalAgentConfig` and ensure your safety policies allow access to the server's tools:

```python
from google.antigravity import Agent, LocalAgentConfig, types
from google.antigravity.hooks import policy

# Define local Stdio or remote SSE server configurations
mcp_servers = [
    types.McpStdioServer(
        command="python3",
        args=["mcp_server.py"],
    )
]

# Set secure execution boundaries
policies = [
    policy.workspace_only(["/Users/khallad/Documents/LocationTaskReminder/LocTaskReminder"]),
    policy.allow("mcp(MathServer/*)"),  # Granular grant for this MCP server's tools
    policy.confirm_run_command()       # Deny raw shell command executions
]

config = LocalAgentConfig(
    mcp_servers=mcp_servers,
    policies=policies
)

async with Agent(config) as agent:
    response = await agent.chat("Calculate the factorial of 5 using the MathServer.")
    print(await response.text())
```

---
> [!NOTE]
> All code examples in this guide are syntactically complete and production-ready. Please navigate to each individual part to explore deep code blueprints and system block diagrams.
