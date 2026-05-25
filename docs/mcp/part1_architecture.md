# Part 1: MCP Architectural Overview & Standard Protocols in Google Antigravity SDK

The Model Context Protocol (MCP) acts as the operational nervous system within the Google Antigravity SDK ecosystem. It establishes an open, standard bidirectional communication framework that enables advanced foundation models to securely, reliably, and seamlessly interface with external computing environments. Rather than treating tools, data lakes, databases, and APIs as proprietary, hard-coded components, the Antigravity SDK abstracts these resources as decoupled, standardized services. 

Through MCP, an agent can dynamically query available schemas, read stateful resources, call registered system operations, and expose formatted prompts to the underlying large language model (LLM). This architectural guide provides an in-depth breakdown of how the Antigravity SDK implements the MCP protocol, details the core classes governing state and transport, contrasts standard execution architectures, and maps the precise request-response lifecycles of stateful agent execution.

---

## 1. Introduction to MCP in Antigravity

Modern cognitive agents require more than raw reasoning; they require contextual integration. The Model Context Protocol addresses this need by standardizing the boundaries between reasoning engines and environmental execution environments.

### The JSON-RPC 2.0 Foundation
At its core, MCP operates on top of the JSON-RPC 2.0 specification. Every interaction—be it discovering a list of database schemas, retrieving the contents of a local configuration file, or invoking a high-privilege system process—is structured as a formal JSON-RPC request, response, or notification.

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "firestore_query_collection",
    "arguments": {
      "collection": "reminders",
      "limit": 10
    }
  },
  "id": "req_01928374a"
}
```

The Antigravity SDK wraps this low-level messaging layer completely. Developers are insulated from writing raw JSON-RPC strings, managing sequence IDs, or manually handling multiplexed transport streams. Instead, they interact with clean programmatic abstractions that represent the structural elements of MCP.

### Structural Elements of MCP
The Antigravity SDK segments external server capabilities into three primary standardized categories:

| MCP Element | Description | Protocol Endpoint | SDK Access Interface |
| :--- | :--- | :--- | :--- |
| **Tools** | Executable actions that allow the model to change the state of the physical world or retrieve computed values. Tools have strictly typed JSON Schema input parameters and return rich multi-modal output (text, images, or files). | `tools/call`, `tools/list` | `agent.tools.execute()` |
| **Resources** | Stateful, read-only data streams exposed to the model. Resources are identified by standard URI schemes (e.g., `file://`, `database://`, `api://`) and can represent static text files, real-time telemetry, or database views. | `resources/read`, `resources/list` | `agent.resources.read()` |
| **Prompts** | Standardized templates that assist in structuring agent inputs. Prompts allow servers to expose pre-designed instructions, system variables, or dynamic context wrappers directly to the reasoning loop. | `prompts/get`, `prompts/list` | `agent.prompts.get()` |

### Security Boundaries
Crucially, MCP in the Antigravity SDK is designed with a "zero-trust" execution model. Tools and resources are not automatically trusted because they are declared by a server. All incoming requests from a server, or tool executions requested by the LLM, must clear the SDK's internal security gate. By utilizing policies like `policy.allow()`, developers can establish strict permissions that govern which servers can run specific tools, what directories are accessible, and when explicit human-in-the-loop authorization is required.

---

## 2. The Three Pillars of Antigravity's Architecture

The architectural integrity of the Antigravity SDK rests upon three tightly integrated, highly specialized classes: `Agent`, `Conversation`, and `Connection`. Together, these pillars decouple cognitive orchestration from session-state preservation and transport mechanics.

```mermaid
graph TD
    Agent[Agent Class <br/> Central Orchestration & Policy Engine] -->|Spawns / Retains| Conversation[Conversation Class <br/> Memory, Token Budget & Turn State]
    Agent -->|Registers & Controls| Connection[Connection Class <br/> JSON-RPC State Machine & Transport Decoupling]
    Connection -->|Binds to physical stream| Transport[Physical Transport <br/> Stdio IPC / SSE HTTP]
```

---

### A. The `Agent` Class

The `Agent` class serves as the central configuration registry, orchestrator, and developer entry point. It represents the logical identity of the cognitive system, encapsulating:
- **System Instructions**: The static core directives governing the model's behavior, persona, and behavioral boundaries.
- **Safety Configurations**: Safety filters, content moderation guidelines, and toxicity thresholds.
- **Dynamic Capabilities**: Declarations of what tools, resources, and templates are active.
- **Security Policy Engine**: Binds specific verification rules (`policy.allow`) to intercept actions before executing transport requests.

#### Lifecycle Hooks and Event Emitters
The `Agent` exposes an asynchronous middleware and hook system that allows developers to inject monitoring, tracing, or custom sanitization logic at distinct execution stages:
- `on_turn_start`: Fired immediately when input is passed to `agent.chat()`.
- `on_tool_call_intercept`: Fired when the model requests a tool execution, enabling runtime verification.
- `on_context_compact`: Fired when memory compaction routines are triggered in the active conversation.
- `on_turn_complete`: Fired when final output has been returned to the calling client.

#### Production Implementation Example (TypeScript)

```typescript
import { Agent, Connection, policy, types } from '@google-antigravity/sdk';

// Instantiate physical database connection using Stdio Transport
const dbConnection = new Connection({
  id: "local-database-server",
  transport: new types.McpStdioServer({
    command: "node",
    args: ["/Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/bin/db-mcp.js"],
    env: {
      DATABASE_URL: "sqlite:///Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/data/reminders.db"
    }
  }),
  retryPolicy: {
    maxAttempts: 5,
    initialDelayMs: 1000,
    backoffFactor: 2.0
  }
});

// Configure the primary Agent orchestrator
export const reminderAgent = new Agent({
  name: "LocationReminderArchitect",
  version: "1.4.0",
  systemInstruction: `
    You are an elite, highly precise Location-Based Reminders and Task Agent.
    Your primary goal is to manage task contexts linked directly to spatial coordinates.
    Always prioritize precision. If coordinates or parameters are missing, prompt the user.
    Do not guess locations, and do not execute database operations without passing strict validation.
  `,
  connections: [dbConnection],
  security: {
    // Explicit security boundary enforcement
    policies: [
      policy.allow({
        server: "local-database-server",
        tools: ["query_reminders", "insert_reminder", "update_reminder_state"],
        resources: [
          "file:///Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/data/schema.sql",
          "file:///Users/khallad/Documents/LocationTaskReminder/LocTaskReminder/data/reminders.db"
        ]
      })
    ],
    fallbackAction: "deny"
  }
});

// Register execution hooks
reminderAgent.on("on_tool_call_intercept", async (event) => {
  console.log(`[SECURITY AUDIT] Intercepted tool call: ${event.toolName} with params:`, event.arguments);
  if (event.toolName === "insert_reminder") {
    // Enforce structured spatial data constraints at the SDK hook boundary
    const { latitude, longitude } = event.arguments;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error(`[SECURITY VIOLATION] Spatial bounds exceeded: Lat ${latitude}, Lng ${longitude}`);
    }
  }
});
```

---

### B. The `Conversation` Class

The `Conversation` class represents a stateful session runner. It is responsible for tracking conversational steps, building the context payload sent to the LLM, managing message histories, and executing specialized memory management processes. 

While the `Agent` is static and stateless, the `Conversation` is dynamic and highly stateful. It tracks every text turn, tool call, tool response, and system directive as a continuous timeline of events.

#### Context Compaction and Token Budgeting
To prevent the underlying model from exceeding its physical context window limits, the `Conversation` implements advanced context compaction routines:
1. **Sliding Window Truncation**: Older turns are progressively pruned, ensuring the system-critical prompts and the most recent turns remain within the active cache.
2. **Recursive Summarization Layer**: When the token threshold reaches a specific high-water mark (e.g., 85% of total capacity), the `Conversation` spawns a sub-process to summarize intermediate turns, replacing detailed historical text blocks with high-density semantic summaries while preserving the exact state of active variables.

#### Stream Execution Architecture
The class features multi-mode execution structures, enabling standard transactional returns or micro-chunk streaming via asynchronous generators (`chat()` and `chat_stream()`).

#### Production Implementation Example (Python)

```python
import asyncio
from typing import AsyncGenerator
from antigravity_sdk import Agent, Conversation, Connection, policy, types

class CustomMemoryCompactor:
    """
    Implements a custom double-buffered compaction routine that retains essential spatial metadata
    while discarding wordy conversational filler when tokens exceed bounds.
    """
    def __init__(self, token_limit: int = 32768):
        self.token_limit = token_limit
        self.trigger_threshold = 0.85  # 85% of physical window

    def needs_compaction(self, current_token_count: int) -> bool:
        return current_token_count >= (self.token_limit * self.trigger_threshold)

    async def compact(self, history: list) -> list:
        print("[COMPACTOR] Executing dynamic token pruning and summarizing older turns...")
        compacted_history = []
        # Keep the foundational system prompt intact (always index 0)
        compacted_history.append(history[0])
        
        # Summarize mid-tier dialog, but preserve critical structured JSON payload tool executions
        summary_payload = "System-generated summary of early turns: User established workspace in Mac and configured database connections."
        compacted_history.append({"role": "system", "content": summary_payload})
        
        # Retain the last 4 turns exactly
        retained_turns = history[-4:]
        compacted_history.extend(retained_turns)
        return compacted_history

# Initialize stateful conversation
async def run_stateful_session():
    # Construct Agent
    agent = Agent(
        name="LocationTaskEngine",
        system_instruction="You manage geofenced reminders."
    )
    
    # Instantiate Conversation linked to the Agent
    compactor = CustomMemoryCompactor(token_limit=16384)
    conversation = Conversation(
        agent=agent,
        conversation_id="session_user_khallad_9921",
        compactor=compactor
    )
    
    # Establish a chat stream context
    user_prompt = "Create a location-based task reminder: 'Buy milk' at Latitude 37.7749, Longitude -122.4194 when I enter the zone."
    
    print("[SESSION START] Dispatched prompt to conversation stream...")
    stream: AsyncGenerator = conversation.chat_stream(user_prompt)
    
    async for chunk in stream:
        if chunk.type == "text":
            print(chunk.content, end="", flush=True)
        elif chunk.type == "tool_call":
            print(f"\n[INTERCEPT] Model invoked local tool: {chunk.tool_name}")
            
    # Verify transaction history size
    history_frames = await conversation.get_history()
    print(f"\n[SESSION COMPLETE] Active History Frames in Memory: {len(history_frames)}")

if __name__ == "__main__":
    asyncio.run(run_stateful_session())
```

---

### C. The `Connection` Class

The `Connection` class acts as the abstract transport controller. It manages the lifecycle of physical network streams, binds transport adapters, translates API calls into standard JSON-RPC 2.0 payloads, and provides system-level reliability patterns.

#### Connection States and Lifecycle
A `Connection` object moves through a highly defined state machine:

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting : connection.connect()
    Connecting --> Connected : Handshake Succeeded (200 OK / Stdio Init)
    Connecting --> Disconnected : Handshake Failed / Timeout
    Connected --> Disconnected : connection.disconnect()
    Connected --> Reconnecting : Network Drop / Heartbeat Failure
    Reconnecting --> Connected : Re-handshake Succeeded
    Reconnecting --> Disconnected : Max Retry Retries Exceeded
```

- **Disconnected**: Transport stream is closed; no system resources are allocated.
- **Connecting**: Establishing standard stream interfaces, running version negotiations, and loading capabilities.
- **Connected**: The channel is fully active. JSON-RPC requests are routed with unique tracking IDs.
- **Reconnecting**: In the event of network disruption or stream drops, the Connection invokes exponential backoff policies to rebuild the stream without interrupting active conversations.

#### Protocol Reliability Mechanisms
- **JSON-RPC State Machine**: Generates monosequential IDs (`id: 1`, `id: 2`, etc.), maintains a registry of pending resolution futures, and maps incoming server responses back to the original calling threads.
- **Heartbeats**: Regularly dispatches empty diagnostic ping requests (e.g., `ping` method) every 15 seconds over the transport layer to verify network availability.
- **Circuit Breakers**: If the server fails to respond to 3 consecutive requests or heartbeats, the connection changes to the `Reconnecting` state, and further tool calls are safely intercepted and queued or failed gracefully.

---

## 3. Decoupled Transport Architectures

The Antigravity SDK features a decoupled transport layer. This enables servers to reside locally on the host machine or globally in remote cloud networks without requiring changes to the agent logic. The two primary transport mechanisms are **Stdio Transport** and **SSE Transport**.

```mermaid
graph LR
    subgraph Stdio Architecture
        AgentProcess[Agent Process] <== Stdin/Stdout Pipes (IPC) ==> Subprocess[Local Server Process]
    end
    
    subgraph SSE Architecture
        AgentClient[Agent Client] -- 1. HTTP POST Request --> RemoteServer[Remote Server Gateway]
        RemoteServer -- 2. Event Stream (SSE) --> AgentClient
    end
```

---

### A. Stdio Transport (`types.McpStdioServer`)

Stdio Transport is the optimal solution for localized tool execution. The agent spawns the MCP server as a dedicated child process on the local operating system, establishing communications via the standard input (`stdin`) and standard output (`stdout`) interfaces.

#### Mechanics & Lifecycle
1. **Process Spawning**: The SDK executes a standard system command (e.g., `node`, `python3`, `bun`) with designated command-line parameters, instantiating the server in an isolated OS thread.
2. **IPC Streams**: The SDK maps the child process's write stream (`stdout`) directly to the SDK's read channel, and the SDK's write channel directly to the child's read stream (`stdin`).
3. **JSON-RPC Framing**: Payloads are delimited by newline characters (`\n`). This requires the server to avoid write statements to stdout that don't match standard framing, as any unstructured text will break JSON-RPC parsing.
4. **Sandboxing and Security**: The server inherits the environmental environment variables and user privileges of the parent process. However, because it runs locally on the same hardware, it has low latency (typically < 2ms per round-trip).
5. **Lifecycle Binding**: The lifecycle of the spawned subprocess is bound to the parent agent. If the agent process encounters an unhandled exception or exits normally, the SDK automatically dispatches a termination signal (`SIGTERM` or `SIGKILL`) to clean up child processes.

---

### B. SSE Transport (`types.McpSseServer`)

For enterprise integrations, serverless architectures, and distributed systems, Stdio Transport is replaced with Server-Sent Events (SSE) Transport. SSE is a lightweight, one-way HTTP push standard that allows servers to stream real-time updates directly to web clients over a persistent connection.

#### Mechanics & Lifecycle
1. **The Downstream Channel (SSE Stream)**:
   - The Antigravity client initiates a long-lived HTTP connection to the MCP Server Gateway, specifying `Accept: text/event-stream` in the request headers.
   - The connection remains open. The remote server uses this persistent TCP connection to push downstream payloads (JSON-RPC requests, diagnostics, server messages) directly to the client.
2. **The Upstream Channel (HTTP Post/Put)**:
   - When the client needs to reply to a server request or trigger a tool, it opens a short-lived, standard HTTP POST request back to the server gateway, carrying the matching JSON-RPC request ID in the request body.
3. **Decoupled Scalability**:
   - **Horizontal Scalability**: Because the upstream is handled via stateless HTTP POSTs, standard load balancers can distribute processing demands across an elastic cluster of server instances.
   - **Authentication**: SSE supports standard web authentication practices, including custom HTTP headers (`Authorization: Bearer <token>`), OAuth2 assertions, CORS validations, and mutual TLS configurations.
   - **Firewall Traversal**: Unlike raw WebSockets, SSE runs entirely over standard HTTP/S protocols, easily passing through corporate proxies, firewalls, and enterprise security layers.

---

### Transport Architecture Deep-Dive Comparison

| Architectural Dimension | Stdio Transport (`types.McpStdioServer`) | SSE Transport (`types.McpSseServer`) |
| :--- | :--- | :--- |
| **Topology** | Host-local loopback process topology. | Distributed, internet-scale client-server topology. |
| **Physical Transport Channel** | Standard OS Pipes (`stdin` / `stdout`). | Stateful HTTP `text/event-stream` & Stateless HTTP POST. |
| **Latency Profile** | Exceptionally low latency (< 2ms). Zero network hops. | Network dependent (typically 20ms - 200ms). |
| **Resource Overhead** | Low memory footprint; limits execution to parent CPU core limits. | Higher setup cost, requires HTTP routing tables and connection trackers. |
| **Authentication Options** | Relies entirely on local OS access controls and environment files. | Rich web-standard capabilities: JWT, Bearer tokens, TLS Certificates, OAuth2. |
| **Horizontal Scalability** | Fixed: Scale is bounded by the host system's hardware resources. | Unlimited: Dynamic scaling via container orchestrators (e.g., Kubernetes). |
| **Firewall / Proxy Handling** | Not applicable (local execution context). | Traverses standard proxies smoothly; supports CORS policies. |
| **System Lifecycle** | Spawned, managed, and killed directly by the parent SDK process. | Decoupled; runs independently of client active sessions. |

---

## 4. Execution and Lifecycle Flow

The diagram below maps the runtime lifecycle of a stateful transaction in the Antigravity SDK. It traces the steps from the initial user request, through security checking, physical transport execution on a remote or local MCP server, and back to the user.

```
+-------------------------------------------------------------------------------------------------------------------------------+
|                                                    ANTIGRAVITY AGENT CONTAINER                                                |
|                                                                                                                               |
|   [1] User Query               [2] Build Context           [3] Tool Discovery           [4] Model Inference                   |
|  =================> [Agent] =====================> [Conv] ======================> [Conn] =====================> [LLM API]       |
|                       ||                            ||                            ||                             ||           |
|                       || (Pre-turn Hook)            || (Token limits checked)     || (Request tools/list)        ||           |
|                       \/                            \/                            \/                             \/           |
|                 (on_turn_start)               (Prune older turns)           (Update definitions)          (Decides on tool)   |
|                                                                                                                          ||   |
+--------------------------------------------------------------------------------------------------------------------------||---+
                                                                                                                           ||
                                                                                                                           ||
+--------------------------------------------------------------------------------------------------------------------------||---+
|   [8] Final Synthesis          [7] Update History          [6] Receive Response         [5] Security Gate Check          ||   |
|  <================= [Agent] <===================== [Conv] <====================== [Conn] <====================== [Policy] <======+
|                       ||                            ||                            ^                              ||
|                       || (Post-turn Hook)           || (Cache frames)             || (JSON-RPC Deserialization)  || (Verify arguments against rules)
|                       \/                            \/                            ||                             \/
|                (on_turn_complete)             (Append step data)                  ||                        (policy.allow)
|                                                                                   ||                             ||
+-----------------------------------------------------------------------------------||-----------------------------||---+
                                                                                    ||                             ||
                                                                                    ||                             || Dispatches tool/call
                                                                                    ||                             || if security checks pass
                                                                                    \/                             \/
                                                                        ===============================================
                                                                        [ STDIO PIPE / SSE TRANSPORT LAYER CONNECTION ]
                                                                        ===============================================
                                                                                            ||
                                                                                            || Dispatches JSON-RPC Packet
                                                                                            \/
                                                                                 +----------------------+
                                                                                 |  TARGET MCP SERVER   |
                                                                                 |                      |
                                                                                 | [Executes requested  |
                                                                                 |  action and queries  |
                                                                                 |  local database]     |
                                                                                 +----------------------+
```

### Dynamic Step-by-Step Walkthrough

#### Step 1: Request Initialization
The developer triggers a turn by calling the primary conversational interface:
```typescript
const response = await reminderAgent.chat("Set a reminder to inspect coordinates 37.7749, -122.4194.");
```
The `Agent` initializes a transition state, sets up tracking logs, and issues the `on_turn_start` hook event.

#### Step 2: Context Assembly & Compaction
The system resolves the session history through the associated `Conversation` object:
1. Historical dialogue, system directives, and prior tool responses are loaded from memory.
2. The compactor calculates token overhead.
3. If token counts approach safety limits, the compactor executes pruning logic to keep the conversational context clean.

#### Step 3: Tool Discovery & Registration
The `Agent` queries the `Connection` registry to confirm the availability of target interfaces. If a connection is fresh or configured for lazy loading, the agent initiates the transport handshake, issues a `tools/list` request to the MCP server, and updates its local tool definitions schema.

#### Step 4: Model Inference
The compiled context (system guidelines, history, active tools schemas) is securely transferred to the underlying LLM. The model processes the query and returns a structured decision block calling a tool:
```json
{
  "tool": "insert_reminder",
  "arguments": {
    "title": "Inspect Location Coordinates",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

#### Step 5: Security Gate Interception
Before the call is sent to the network transport, the SDK intercepts the execution:
1. The dynamic argument payload is passed through `policy.allow()`.
2. The arguments are checked against strict schema definitions.
3. Custom developer validation rules are evaluated at the agent's intercept hook stage.
4. If validation fails, the SDK halts execution and returns an error without making a network request.

#### Step 6: Transport Dispatch & Server Execution
If security checks pass, the `Connection` instance processes the request:
1. The call is serialized into a standard JSON-RPC `tools/call` envelope with a unique correlation ID.
2. The payload is sent over the configured transport channel (via stdin/stdout for Stdio, or HTTP POST for SSE).
3. The MCP server processes the instructions, writes to its local databases, and returns the response block containing the operation's result.

#### Step 7: Response Routing and Context Accumulation
The physical transport layer receives the response payload, and the `Connection` matches the sequence ID back to the waiting execution promise. The payload is deserialized and returned to the active `Conversation` sequence. The conversational engine logs the event, updates the token budget, and passes the updated timeline back to the LLM to complete its reasoning loop.

#### Step 8: Final Synthesis and Client Delivery
The LLM reads the completed tool output context and generates a user-friendly conversational response. The `Agent` wraps this response, issues the `on_turn_complete` hook event, and returns the final answer to the calling client.

---

## 5. End-to-End Multilingual Integration Blueprint

To illustrate these principles in practice, the following blueprints demonstrate how to configure and deploy a complete MCP environment. They show how to register standard transport adapters, apply strict security policies, and manage stateful agent execution loops.

### Full-Stack Implementation: TypeScript Blueprint

```typescript
import { Agent, Connection, Conversation, policy, types } from '@google-antigravity/sdk';
import * as path from 'path';

// 1. Establish the Decoupled Transport Configuration
const sseGatewayConnection = new Connection({
  id: "production-reminders-gateway",
  transport: new types.McpSseServer({
    url: "https://mcp-gateway.dangenstorf.internal/v1/sse",
    headers: {
      "Authorization": "Bearer AG_SECURE_TOKEN_01928374a",
      "X-Target-Tenant": "tenant_khallad_location"
    }
  }),
  retryPolicy: {
    maxAttempts: 3,
    initialDelayMs: 500,
    backoffFactor: 1.5
  }
});

// 2. Define the Agent Orchestrator with strict security policies
const masterAgent = new Agent({
  name: "MasterRemindersOrchestrator",
  systemInstruction: `
    You are an enterprise systems orchestrator specialized in geofenced reminder operations.
    Always query the server for schema updates prior to writing.
    Follow structural bounds policies perfectly.
  `,
  connections: [sseGatewayConnection],
  security: {
    policies: [
      policy.allow({
        server: "production-reminders-gateway",
        tools: ["list_active_alerts", "register_geofence_task"],
        resources: ["*"]
      })
    ],
    fallbackAction: "deny"
  }
});

// 3. Orchestrate the conversational turn inside an active execution flow
async function executeRemindersWorkflow() {
  try {
    // Spawn a stateful session
    const session = new Conversation({
      agent: masterAgent,
      conversation_id: "conv_flow_991823"
    });

    console.log("[WORKFLOW] Dispatching query to SSE Server endpoint...");
    const stream = await session.chat("List active alerts for location task reminder system.");
    
    console.log("[WORKFLOW RESULT]:", stream.text);

  } catch (error: any) {
    console.error("[CRITICAL WORKFLOW EXCEPTION]:", error.message);
  } finally {
    // Safely tear down active transport connections
    await sseGatewayConnection.disconnect();
  }
}

executeRemindersWorkflow();
```

### Full-Stack Implementation: Python Blueprint

```python
import asyncio
import os
from antigravity_sdk import Agent, Connection, Conversation, policy, types

async def run_secure_agent_workflow():
    # 1. Instantiate the local process Stdio Transport
    stdio_transport = types.McpStdioServer(
        command="python3",
        args=[os.path.abspath("./bin/spatial_calculator.py")],
        env={
            "PYTHONPATH": os.getcwd(),
            "CALCULATOR_MODE": "HIGH_PRECISION"
        }
    )

    # 2. Bind the transport configuration to an active Connection
    calc_connection = Connection(
        id="local-spatial-calculator",
        transport=stdio_transport
    )

    # 3. Create the Agent with an explicit security policy
    agent = Agent(
        name="SpatialDataProcessor",
        system_instruction="You calculate precise geofence boundary intersections.",
        connections=[calc_connection],
        security={
            "policies": [
                policy.allow(
                    server="local-spatial-calculator",
                    tools=["calculate_radius", "intersect_coordinates"],
                    resources=[]
                )
            ],
            "fallback_action": "deny"
        }
    )

    # 4. Initialize the Conversation container
    conversation = Conversation(
        agent=agent,
        conversation_id="conv_calc_session_881"
    )

    try:
        # 5. Dispatch task execution
        result = await conversation.chat(
            "Calculate intersection density for point Lat 37.7749, Lng -122.4194 with 500m radius."
        )
        print("[PROCESSOR OUTPUT]:", result.text)

    except Exception as e:
        print(f"[PROCESSOR EXCEPTION ERROR]: {str(e)}")
        
    finally:
        # 6. Ensure clean release of system process handles
        await calc_connection.disconnect()

if __name__ == "__main__":
    asyncio.run(run_secure_agent_workflow())
```
