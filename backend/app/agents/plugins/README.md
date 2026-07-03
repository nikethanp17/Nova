# app/agents/plugins/

Subdirectory housing pluggable agents executing specialized task pipelines.

## Directory Responsibilities

Every subfolder implements a standalone agent:
- **`planner/`**: Decomposes requests and selects target execute steps.
- **`browser_agent/`**: Directly operates page elements and triggers clicks/navigations.
- **`form_filler/`**: Detects inputs, matches database mappings, and populates inputs.
- **`execution_validator/`**: Analyzes DOM and reports post-operation page health.
- **`__template__/`**: Scaffolding reference structure for developers implementing new agents.
