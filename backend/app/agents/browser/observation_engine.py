"""Observation Engine for Browser Agent.

Analyzes the active browser page to extract interactive elements, visible text,
accessibility structures, and DOM summaries.
"""

import logging
from typing import Any

try:
    from playwright.async_api import Page  # type: ignore[import-not-found]

    PLAYWRIGHT_AVAILABLE = True
except ModuleNotFoundError:
    PLAYWRIGHT_AVAILABLE = False

    class Page:  # type: ignore[no-redef]
        pass


logger = logging.getLogger(__name__)


class ObservationEngine:
    """Scans and extracts structured page data for LLM reasoning loops."""

    async def observe(self, page: Any) -> dict[str, Any]:
        """Extract elements, text, and structure from active page.

        Args:
            page: Active Playwright Page or mock equivalent.

        Returns:
            dict[str, Any]: Structured observation payload.
        """
        if not PLAYWRIGHT_AVAILABLE or not getattr(page, "evaluate", None):
            # Mock observation fallback
            return {
                "url": getattr(page, "url", None) or "http://localhost:3000",
                "title": "Mock Page Title",
                "visible_text": "Welcome to the Mock Page. Input credentials to login.",
                "elements": [
                    {
                        "idx": 1,
                        "tagName": "input",
                        "type": "text",
                        "selector": "input[type='text']",
                        "id": "email",
                        "name": "email",
                        "value": "",
                        "checked": None,
                        "placeholder": "Enter your email",
                        "text": "Email Address",
                        "role": None,
                    },
                    {
                        "idx": 2,
                        "tagName": "button",
                        "type": "submit",
                        "selector": "button[type='submit']",
                        "id": "submit-btn",
                        "name": None,
                        "value": None,
                        "checked": None,
                        "placeholder": None,
                        "text": "Sign In",
                        "role": None,
                    },
                ],
                "accessibility_tree": {},
                "dom_summary": (
                    "<body><input id='email' /><button>Sign In</button></body>"
                ),
            }

        try:
            url = page.url
            title = await page.title()

            # Execute JS selector tagging in the page context
            js_script = """
            () => {
                // Clear any existing labels
                const existing = document.querySelectorAll('[data-nova-idx]');
                existing.forEach(el => el.removeAttribute('data-nova-idx'));

                const isVisible = (el) => {
                    if (!el) return false;
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return false;
                    const style = window.getComputedStyle(el);
                    if (
                        style.display === 'none' ||
                        style.visibility === 'hidden' ||
                        style.opacity === '0'
                    ) return false;
                    return true;
                };

                const selector = [
                    'a', 'button', 'input', 'select', 'textarea',
                    '[role="button"]', '[role="checkbox"]', '[role="radio"]'
                ].join(', ');
                const elements = Array.from(
                    document.querySelectorAll(selector)
                ).filter(isVisible);

                const interactiveElements = [];
                elements.forEach((el, index) => {
                    const idx = index + 1;
                    el.setAttribute('data-nova-idx', String(idx));

                    let label = '';
                    if (el.tagName === 'INPUT' && el.id) {
                        const labelEl = document.querySelector(`label[for="${el.id}"]`);
                        if (labelEl) label = labelEl.innerText;
                    }
                    if (!label) {
                        label = (
                            el.innerText ||
                            el.getAttribute('aria-label') ||
                            el.getAttribute('placeholder') ||
                            el.getAttribute('title') ||
                            ''
                        );
                    }
                    label = label.trim();

                    interactiveElements.push({
                        idx: idx,
                        tagName: el.tagName.toLowerCase(),
                        type: el.getAttribute('type') || null,
                        selector: `[data-nova-idx="${idx}"]`,
                        id: el.id || null,
                        name: el.getAttribute('name') || null,
                        value: el.value || null,
                        checked: el.checked || null,
                        placeholder: el.getAttribute('placeholder') || null,
                        text: label,
                        href: el.getAttribute('href') || null,
                        role: el.getAttribute('role') || null,
                    });
                });

                const visibleText = document.body.innerText
                    .replace(/\\s+/g, ' ')
                    .substring(0, 5000);
                return {
                    elements: interactiveElements,
                    visibleText: visibleText
                };
            }
            """
            result = await page.evaluate(js_script)
            elements = result.get("elements", [])
            visible_text = result.get("visibleText", "")

            # Extract accessibility tree snapshot
            accessibility_tree: dict[str, Any] = {}
            try:
                accessibility_tree = await page.accessibility.snapshot() or {}
            except Exception as e:
                logger.warning(f"Failed to capture accessibility tree: {e}")

            # Build a token-efficient DOM summary string representation
            dom_lines = []
            for el in elements:
                el_type = f" type='{el['type']}'" if el["type"] else ""
                el_id = f" id='{el['id']}'" if el["id"] else ""
                el_text = f" label='{el['text']}'" if el["text"] else ""
                dom_lines.append(
                    f"<{el['tagName']}{el_type}{el_id}{el_text} "
                    f"selector='{el['selector']}' />"
                )
            dom_summary = "\n".join(dom_lines)

            return {
                "url": url,
                "title": title,
                "visible_text": visible_text,
                "elements": elements,
                "accessibility_tree": accessibility_tree,
                "dom_summary": dom_summary,
            }

        except Exception as e:
            logger.error(f"Observation failed: {e}")
            return {
                "url": getattr(page, "url", "unknown"),
                "title": "Error Observing Page",
                "visible_text": f"Failed to inspect page DOM elements: {str(e)}",
                "elements": [],
                "accessibility_tree": {},
                "dom_summary": "",
            }
