# Security, Access Control, and Permission Policies for MCP Tools in the Google Antigravity SDK

Operating within an agentic ecosystem demands rigorous guardrails to prevent unauthorized execution, data exfiltration, and privilege escalation. The Google Antigravity SDK implements a robust, enterprise-grade access control model designed specifically for the Model Context Protocol (MCP). By separating tool definitions from their execution privileges, the SDK ensures that agents operate with the absolute minimum required permissions, providing a strong sandbox that protects host resources.

This documentation details the declarative security framework, the strict priority rules governing permission resolution, argument-level validation techniques, and provides concrete, production-ready integration templates.

---

## 1. The Declarative Policy Framework

The Antigravity SDK relies on a **Declarative Policy Framework** to establish trust boundaries. Rather than embedding security checks imperatively inside the business logic of each tool, developers define high-level permission statements that are evaluated by the SDK’s runtime engine before any tool is invoked.

```
                    +-----------------------------+
                    |      LLM Agent Request      |
                    +--------------+--------------+
                                   |
                                   v
                    +-----------------------------+
                    |  Antigravity Policy Engine  |
                    |   (Declarative Security)    |
                    +--------------+--------------+
                                   |
            +----------------------+----------------------+
            |                      |                      |
            v                      v                      v
      [ ALLOW ]                [ ASK ]                [ DENY ]
  Proceed immediately     Prompt user approval      Abort execution
```

### Sandbox Isolation & Trust Boundaries
Agents are inherently non-deterministic. When integrated with external tools—such as database connectors, shell executors, or local APIs—they bridge the gap between untrusted language models and trusted computing environments. 

The Declarative Policy Framework treats the LLM and the tools as untrusted inputs. Every tool execution undergoes validation at the SDK layer:
* **Tool Isolation:** Tools are run in decoupled subprocesses or sandboxed worker threads depending on the transport interface (`types.McpStdioServer` or `types.McpSseServer`).
* **Environment Scrubbing:** Default environment variables are cleared. Only explicitly whitelisted configurations are passed down to server subprocesses.
* **Input Canonicalization:** Before policies evaluate file paths or CLI commands, parameters are sanitized and paths are normalized to resolve symbolic links and relative traversals (`../`).

### Default Out-of-the-Box Behavior
The SDK operates on a strict **fail-closed** paradigm.
* **Standard MCP Tools:** Tools registered via typical local servers are denied unless explicitly allowed.
* **Shell Access & CLI Executions:** Any request to execute a raw shell command (e.g., via standard command line execution tools) triggers the `confirm_run_command` filter. By default, this filter denies all raw shell access unless explicit interactive confirmation is received from the user or a custom preset overrides it.
* **Filesystem Access:** File operations are restricted. Tools attempting to traverse outside of defined scratch or temp spaces will fail unless a policy specifically white-lists the scope.

---

## 2. Policy Resolution Order (Precedence)

When an agent requests the execution of a tool, the Antigravity Policy Engine evaluates all active security rules. Because policies can have overlapping rules (e.g., a specific allowance vs. a wildcard denial), the engine resolves conflicts using a strict, non-overrideable precedence model.

### The Six-Tier Precedence Hierarchy
Rules are categorized and evaluated in the following sequence. **The first matching rule determines the outcome.**

| Priority | Rule Type | Target Scope | Action | Description |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Specific Deny** | `server_name/tool_name` | **DENY** | Blocks execution of a precise tool. Takes ultimate precedence. |
| **2** | **Specific Ask** | `server_name/tool_name` | **ASK** | Requires runtime interactive confirmation for a precise tool. |
| **3** | **Specific Allow** | `server_name/tool_name` | **ALLOW** | Automatically allows a precise tool to execute without prompt. |
| **4** | **Wildcard Deny** | `server_name/*` or `*/*` | **DENY** | Blocks execution for all tools under a server or all servers. |
| **5** | **Wildcard Ask** | `server_name/*` or `*/*` | **ASK** | Prompts for confirmation for any tool matching the wildcard. |
| **6** | **Wildcard Allow** | `server_name/*` or `*/*` | **ALLOW** | Automatically runs any tool matching the wildcard. |

### The "First Match Wins" Flow
The policy engine sorts active declarations from high to low priority. When a tool call is evaluated:
1. It looks for rules matching the exact server and tool identifier (`Specific`).
2. If multiple rules match at the same level, a **Deny** rule always overrides an **Ask** rule, and an **Ask** rule always overrides an **Allow** rule.
3. If no specific match is found, the engine falls back to `Wildcard` rules, applying the same Deny > Ask > Allow logic.

### Visualizing the Evaluation Decision Tree

```mermaid
graph TD
    A[Agent Requests Tool Call] --> B{Specific Deny Matches?}
    B -- Yes --> C[Result: DENY Execution]
    B -- No --> D{Specific Ask Matches?}
    D -- Yes --> E[Result: ASK User]
    D -- No --> F{Specific Allow Matches?}
    F -- Yes --> G[Result: ALLOW Execution]
    F -- No --> H{Wildcard Deny Matches?}
    H -- Yes --> C
    H -- No --> I{Wildcard Ask Matches?}
    I -- Yes --> E
    I -- No --> J{Wildcard Allow Matches?}
    J -- Yes --> G
    J -- No --> K[Result: DEFAULT DENY (Fail Closed)]
```

> [!IMPORTANT]
> **The Fail Closed Mechanism:** If a tool invocation reaches the end of the evaluation tree without matching any rule (Specific or Wildcard), it is rejected automatically. The SDK raises a `SecurityPolicyException` and returns a standardized error string back to the calling agent, preventing any state leak.

---

## 3. MCP Tool Grants & Wildcard Scoping

The SDK identifies MCP tools using a standardized URI namespace:
```
mcp(server_name/tool_name)
```
Permissions are declared using this namespace, enabling fine-grained sandboxing per MCP server instance.

* **Specific Tool Scope:** `mcp(firebase-mcp-server/firestore_get_document)` references a single tool.
* **Wildcard Server Scope:** `mcp(firebase-mcp-server/*)` matches every tool exposed by the designated server.
* **Global Wildcard Scope:** `mcp(*/*)` or simply `mcp(*)` matches all MCP tools across all servers.

### Python Declarative Scoping Example
```python
from antigravity.sdk import policy

# Allow a specific read tool from the Firebase MCP server
policy.allow("mcp(firebase-mcp-server/firestore_get_document)")

# Prompt the user interactively for structural stitch operations
policy.ask("mcp(stitch/edit_screens)")

# Explicitly deny any deletion capabilities under Firebase
policy.deny("mcp(firebase-mcp-server/firestore_delete_document)")
policy.deny("mcp(firebase-mcp-server/firestore_delete_database)")

# Fallback: All other tools under 'stitch' are allowed automatically
policy.allow("mcp(stitch/*)")
```

### TypeScript Declarative Scoping Example
```typescript
import { policy } from '@google/antigravity-sdk';

// Enforce specific denials first
policy.deny('mcp(firebase-mcp-server/firestore_delete_database)');

// Allow granular document fetching
policy.allow('mcp(firebase-mcp-server/firestore_get_document)');

// Require approval for visual generations
policy.ask('mcp(stitch/generate_screen_from_text)');

// Wildcard grant for all other stitch operations
policy.allow('mcp(stitch/*)');
```

---

## 4. Convenience Presets & Predicates

Writing granular rules for hundreds of individual files or arguments can be complex. The Antigravity SDK provides native presets and argument predicates to inject dynamic run-time constraints efficiently.

### Convenience Presets
The SDK provides built-in macros for common enterprise security tasks:

1. **`policy.confirm_run_command()`**
   Forces any execution tool (e.g. native terminal tools, shell execution bridges) to suspend and prompt the developer with a clear visual diff of the proposed commands.
2. **`policy.workspace_only()`**
   Automatically wraps all standard file reading, writing, and listing tools. It guarantees that operations are locked inside the absolute path of the user's workspace directory, blocking path traversals via symlinks or parent references (`..`).

### Custom Lambda Predicates
For granular parameter checking, policies support pass-through callback functions (predicates). The callback intercepts the tool argument payload before execution, performing security checks and returning a boolean.

```
+------------------+     JSON Payload      +-----------------------+
|  Tool Arguments  |---------------------->|   Lambda Predicate    |
+------------------+                       +-----------+-----------+
                                                       |
                                            Checks for unsafe strings
                                            or out-of-bounds inputs
                                                       |
                                            [True]     v     [False]
                                         +-------------+-------------+
                                         |                           |
                                         v                           v
                                     [ ALLOW ]                   [ DENY ]
```

#### Python Advanced Predicate Configuration
```python
import os
from antigravity.sdk import policy

# 1. Enforce shell interception preset
policy.confirm_run_command()

# 2. Enforce filesystem isolation preset
policy.workspace_only()

# 3. Dynamic parameter inspection predicate
def audit_command_line(args: dict) -> bool:
    """Returns True if the arguments are deemed hazardous, triggering the rule."""
    cmd = args.get("CommandLine", "").lower()
    dangerous_sub_strings = [
        "sudo", "rm -rf", "chmod", "curl", "wget", 
        "/etc/passwd", "/etc/shadow", "mkfs", "dd"
    ]
    return any(unsafe in cmd for unsafe in dangerous_sub_strings)

# Attach predicate to a specific DENY rule
# If audit_command_line returns True, access is denied immediately
policy.deny("run_command", predicate=audit_command_line)
```

#### TypeScript Advanced Predicate Configuration
```typescript
import { policy } from '@google/antigravity-sdk';

// 1. Enable standard workspace sandboxing
policy.workspaceOnly();

// 2. Enable shell protection
policy.confirmRunCommand();

// 3. Dynamic argument-level validation
policy.deny('run_command', (args: Record<string, any>) => {
  const command = (args.CommandLine || '').toLowerCase();
  
  // Prevent piping or inline shell injections
  const suspiciousTokens = [';', '&&', '||', '|', '>', '`', '$('];
  const containsSuspicious = suspiciousTokens.some(token => command.includes(token));
  
  // Block remote scripts downloads
  const containsDownloader = /curl|wget|fetch/i.test(command);
  
  return containsSuspicious || containsDownloader;
});
```

---

## 5. Safe Integration Templates

These templates demonstrate how to combine presets, specific grants, wildcards, and predicates into production-grade setups.

### Template 1: Strict Zero-Trust Setup (Deny-By-Default)
*Best for: Customer-facing web deployments, public-facing chatbots, or automated operations handling production user data.*

```python
"""
security_zero_trust.py
Implements an absolute sandboxed, zero-trust profile. Denies all local execution
and limits MCP tools to specific read-only database capabilities.
"""

from antigravity.sdk import policy, AntigravityApp

# Reset and clear any default settings
policy.clear_all_rules()

# 1. Deny raw system command executions globally
policy.deny("run_command")
policy.deny("shell_exec")

# 2. Sandbox all file operations to a read-only isolated asset directory
policy.workspace_only(read_only=True, custom_root="/var/app/static_assets")

# 3. Allow precise database read actions
policy.allow("mcp(firebase-mcp-server/firestore_get_document)")
policy.allow("mcp(firebase-mcp-server/firestore_list_documents)")

# 4. Deny all structural updates, migrations, and structural creations explicitly
policy.deny("mcp(firebase-mcp-server/firestore_update_document)")
policy.deny("mcp(firebase-mcp-server/firestore_delete_document)")
policy.deny("mcp(firebase-mcp-server/firestore_create_database)")

# 5. Wildcard Deny: Any other tool or server is blocked automatically
policy.deny("mcp(*/*)")

def run_agent():
    app = AntigravityApp(
        server_transport="sse",
        policy_enforcement="strict"
    )
    # The application is now fully locked down
    app.start()

if __name__ == "__main__":
    run_agent()
```

### Template 2: Workspace-Restricted Developer Agent Setup
*Best for: Local code editing agents, MLOps orchestration systems, and automated test runners.*

```typescript
/**
 * security_dev_workspace.ts
 * Configures an agent with standard development permissions. Restricts actions 
 * strictly to a safe local directory, and requires manual user approval 
 * for any system-level commands.
 */

import { policy, AntigravityApp } from '@google/antigravity-sdk';

async function initializeSecurityContext() {
  // Clear default policies to avoid implicit behaviors
  policy.clearAllRules();

  // 1. Enforce strict workspace boundaries
  // Blocks writing or reading configuration files outside the target directory
  policy.workspaceOnly({
    rootDirectory: '/Users/developer/projects/LocTaskReminder',
    allowSymlinks: false,
    blockDotFiles: true // Blocks reading/writing of .env, .git, etc.
  });

  // 2. Intercept shell commands with custom safety filtering
  policy.confirmRunCommand();
  
  // Add a defensive predicate to reject high-risk command strings automatically
  policy.deny('run_command', (args: Record<string, any>) => {
    const rawCommand = (args.CommandLine || '').trim();
    
    // Automatically deny system configuration tools, cleanings, or installations
    const blockedTools = ['brew install', 'npm install -g', 'sudo', 'rm -rf /'];
    return blockedTools.some(tool => rawCommand.includes(tool));
  });

  // 3. MCP Permissions for design and generation systems
  // Allow UI creation operations from Stitch UI generator
  policy.allow('mcp(stitch/list_screens)');
  policy.allow('mcp(stitch/get_screen)');
  
  // Require manual approval when the agent modifies screens or exports assets
  policy.ask('mcp(stitch/generate_screen_from_text)');
  policy.ask('mcp(stitch/edit_screens)');

  // 4. Fallback: Block all other unknown third-party MCP servers
  policy.deny('mcp(*/*)');
}

export async function bootstrap() {
  await initializeSecurityContext();
  
  const app = new AntigravityApp({
    name: 'SafeDeveloperAgent',
    port: 8080,
    secureMode: true
  });
  
  await app.start();
}
```

### Template 3: State-Mutating Interactive User-in-the-Loop Gateway
*Best for: Production tools handling financial systems, database modification portals, or administrative dashboard operations.*

```python
"""
security_interactive_gateway.py
Implements user-in-the-loop validation for all destructive operations, 
ensuring an operator validates structural actions while permitting 
fast, automated reads.
"""

from antigravity.sdk import policy, AntigravityApp

# Clear rules
policy.clear_all_rules()

# 1. Enforce global filesystem restriction - no system files
policy.workspace_only()

# 2. Fast-path: Automatically permit routine database querying and listing
policy.allow("mcp(firebase-mcp-server/firestore_get_document)")
policy.allow("mcp(firebase-mcp-server/firestore_list_documents)")
policy.allow("mcp(firebase-mcp-server/firestore_list_collections)")

# 3. User-in-the-loop: Intercept all data modification actions for validation
policy.ask("mcp(firebase-mcp-server/firestore_add_document)")
policy.ask("mcp(firebase-mcp-server/firestore_update_document)")
policy.ask("mcp(firebase-mcp-server/firestore_delete_document)")

# 4. Deep Protection: Deny all structural changes completely, regardless of approval
policy.deny("mcp(firebase-mcp-server/firestore_create_database)")
policy.deny("mcp(firebase-mcp-server/firestore_delete_database)")
policy.deny("mcp(firebase-mcp-server/firestore_create_index)")

# 5. Argument validation: If an add_document request targets a critical schema, block it
def contains_billing_data(args: dict) -> bool:
    collection = args.get("collectionPath", "").lower()
    return "billing" in collection or "invoice" in collection or "payment" in collection

policy.deny("mcp(firebase-mcp-server/firestore_add_document)", predicate=contains_billing_data)
policy.deny("mcp(firebase-mcp-server/firestore_update_document)", predicate=contains_billing_data)

# 6. Global MCP fallback: Require interactive confirmation for any unregistered tool
policy.ask("mcp(*/*)")

def main():
    app = AntigravityApp(
        policy_mode="interactive",
        notification_channel="desktop_alert"
    )
    app.start()

if __name__ == "__main__":
    main()
```

---

## 6. Key Takeaways and Best Practices

To maintain a secure workspace and agent execution cycle, always follow these design principles:

1. **Adhere to the Principle of Least Privilege:**
   Never declare `policy.allow("mcp(*/*)")` or similar global permissions in a production system. Grant specific tools using full URI paths where possible.
2. **Always Use `workspace_only()`:**
   Mitigate directory traversal exploits by constraining the agent’s execution root. Ensure standard path sanitization handles relative and symbolic lookups before policy evaluation.
3. **Use Denies as Guardrails:**
   Use specific `deny` statements (with descriptive custom predicates) to block administrative, destructive, or installer commands.
4. **Implement Multilayered Validation:**
   Combine system-level policy checks (the Antigravity engine) with database-level security protocols (e.g., Firestore security rules, IAM permission profiles) to create a defense-in-depth architecture.
