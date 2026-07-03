# app/agents/

Handles AI intent classification, task planning, and orchestration. Features an extensible plugin framework matching the BaseAgent interface.

## Directory Responsibilities

- `orchestrator.py`: Controls agent status states and graph flows using LangGraph.
- `router.py`: Interprets natural language user instructions to assign target agents.
- `registry.py`: Scans, validates, and registers agent plugins dynamically.
- `base_agent.py`: Provides abstract classes outlining required capabilities.
- **`plugins/`**: Contains pluggable agent packages (e.g. Planner, Browser, Form Filler, Execution Validator).
