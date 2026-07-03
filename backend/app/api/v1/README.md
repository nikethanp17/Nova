# app/api/v1/

Contains the version 1 controllers/routers for all REST operations.

## Directory Responsibilities

Every module corresponds to a specific domain resource controller:
- `auth.py`: Handles signup, login, OAuth redirection, token refreshes, and logout.
- `users.py`: Handles user profiles, deletion, and settings updates.
- `tasks.py`: Accepts user instructions, tracks task runs, and yields process timelines.
- `documents.py`: Manages uploading, listing, and retrieving personal documents.
- `memory.py`: Exposes CRUD utilities for personal context memory.
- `vault.py`: Operates secure creation and masking retrieval of user credentials.
- `agents.py`: Reads registry entries of dynamically discovered plugins.
- `notifications.py`: Handles reading, listing, and processing in-app notifications.
- `health.py`: Root and health inspection targets.
