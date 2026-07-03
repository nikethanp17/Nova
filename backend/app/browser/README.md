# app/browser/

Manages browser automation utilities utilizing Playwright.

## Directory Responsibilities

- `engine.py`: Handles creation, context settings, and closure lifecycle of browsers.
- `actions.py`: Wraps interactions (typing, scrolling, screenshotting) in human-like timing blocks.
- `safety.py`: Sanitizes targets against domain allowlists and records step audit trails.
