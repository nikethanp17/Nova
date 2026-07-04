"""Browser agent dependency injection module.

Provides driver and agent builders for presentation routes.
"""

from app.agents.browser.browser_agent import BrowserAgent
from app.agents.browser.browser_driver import BrowserDriver, PlaywrightDriver


def get_browser_driver() -> BrowserDriver:
    """Instantiate a clean PlaywrightDriver instance."""
    return PlaywrightDriver()


def get_browser_agent() -> BrowserAgent:
    """Instantiate the BrowserAgent with a PlaywrightDriver adapter."""
    return BrowserAgent(driver=get_browser_driver())
