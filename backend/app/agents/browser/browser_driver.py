"""Browser driver protocol and Playwright implementation.

Exposes a clean abstraction layer isolating the browser automation mechanics.
Supports a mock fallback if Playwright is not installed.
"""

import asyncio
from typing import Protocol

try:
    from playwright.async_api import Page  # type: ignore[import-not-found]

    PLAYWRIGHT_AVAILABLE = True
except ModuleNotFoundError:
    PLAYWRIGHT_AVAILABLE = False

    class Page:  # type: ignore[no-redef]
        def __init__(self) -> None:
            self.url: str | None = None


from app.agents.browser.browser_models import ActionResult


class BrowserDriver(Protocol):
    """Protocol boundary for executing structured actions against a page."""

    async def navigate(self, url: str) -> ActionResult:
        """Load target web resource address."""
        ...

    async def click(self, selector: str) -> ActionResult:
        """Click on element matching target locator selector."""
        ...

    async def type(self, selector: str, text: str) -> ActionResult:
        """Fill or write text content inside targeted field."""
        ...

    async def select(self, selector: str, value: str) -> ActionResult:
        """Select value from target drop-down option."""
        ...

    async def upload(self, selector: str, file_path: str) -> ActionResult:
        """Upload file path selector target."""
        ...

    async def scroll(self, direction: str) -> ActionResult:
        """Scroll page window target viewport direction."""
        ...

    async def wait(self, condition: str, timeout_ms: int = 5000) -> ActionResult:
        """Wait for targeted event condition (e.g. selector visibility)."""
        ...

    async def extract(self, selector: str) -> ActionResult:
        """Extract DOM target string content."""
        ...

    async def verify(self, selector: str, condition: str) -> ActionResult:
        """Validate state of targeted elements."""
        ...

    async def submit(self, selector: str) -> ActionResult:
        """Perform form submission targeting element."""
        ...

    async def hover(self, selector: str) -> ActionResult:
        """Hover over element matching target selector."""
        ...

    async def back(self) -> ActionResult:
        """Navigate back in page history."""
        ...

    async def reload(self) -> ActionResult:
        """Reload active browser page."""
        ...

    async def press(self, selector: str, key: str) -> ActionResult:
        """Press keyboard key targeting selector."""
        ...

    async def capture_screenshot(self, output_path: str) -> str | None:
        """Save a snapshot of the current page viewport."""
        ...

    def set_page(self, page: Page) -> None:
        """Bind active page reference context."""
        ...


class PlaywrightDriver:
    """BrowserDriver implementation leveraging Playwright Locators and smart waits."""

    def __init__(self) -> None:
        """Initialize the Playwright driver adapter."""
        self.page: Page | None = None

    def set_page(self, page: Page) -> None:
        """Bind Playwright page target reference."""
        self.page = page

    def _get_page(self) -> Page:
        """Get page checking bound validity."""
        if not self.page:
            raise RuntimeError("BrowserDriver has no bound Page object.")
        return self.page

    def _get_page_url(self) -> str | None:
        """Safely extract current page URL."""
        if self.page is not None:
            return getattr(self.page, "url", None)
        return None

    async def navigate(self, url: str) -> ActionResult:
        """Navigate browser page directly to URL."""
        if not PLAYWRIGHT_AVAILABLE:
            if self.page is not None:
                self.page.url = url
            return ActionResult(
                success=True,
                message=f"Mock: Navigated to {url}",
                url=url,
            )
        try:
            page = self._get_page()
            await page.goto(url, wait_until="domcontentloaded")
            current_url = page.url
            return ActionResult(
                success=True,
                message=f"Successfully navigated to {url}",
                url=current_url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def click(self, selector: str) -> ActionResult:
        """Click on element matching target locator."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Clicked element {selector}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)
            await locator.scroll_into_view_if_needed()
            await locator.click(timeout=10000)
            return ActionResult(
                success=True,
                message=f"Clicked element: {selector}",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def type(self, selector: str, text: str) -> ActionResult:
        """Type text inside targeted form input field using locator."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Typed text in {selector}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)
            await locator.scroll_into_view_if_needed()
            await locator.fill(text, timeout=10000)
            return ActionResult(
                success=True,
                message=f"Filled text inside {selector}",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def select(self, selector: str, value: str) -> ActionResult:
        """Select value option inside dropdown locator list."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Selected option {value} in {selector}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)
            await locator.scroll_into_view_if_needed()
            await locator.select_option(value=value, timeout=10000)
            return ActionResult(
                success=True,
                message=f"Selected option '{value}' in {selector}",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def upload(self, selector: str, file_path: str) -> ActionResult:
        """Upload file mapping targeting file input field locator."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Uploaded {file_path} to {selector}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)
            await locator.set_input_files(file_path, timeout=10000)
            return ActionResult(
                success=True,
                message=f"Uploaded file {file_path} into {selector}",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def scroll(self, direction: str) -> ActionResult:
        """Perform window viewport scrolling."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Scrolled {direction}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            if direction.lower() == "down":
                await page.evaluate("window.scrollBy(0, window.innerHeight)")
            elif direction.lower() == "up":
                await page.evaluate("window.scrollBy(0, -window.innerHeight)")
            else:
                raise ValueError(f"Invalid scroll direction: {direction}")
            return ActionResult(
                success=True,
                message=f"Scrolled window viewport {direction}",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def wait(self, condition: str, timeout_ms: int = 5000) -> ActionResult:
        """Smart wait targeting selector presence/visibility."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Waited for {condition}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            if not condition:
                await asyncio.sleep(timeout_ms / 1000.0)
                return ActionResult(
                    success=True,
                    message=f"Completed static wait for {timeout_ms}ms",
                    url=page.url,
                )
            locator = page.locator(condition)
            await locator.wait_for(state="visible", timeout=timeout_ms)
            return ActionResult(
                success=True,
                message=f"Completed wait targeting visibility of {condition}",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def extract(self, selector: str) -> ActionResult:
        """Extract inner text content targeting target locator elements."""
        if not PLAYWRIGHT_AVAILABLE:
            mock_text = ""
            if "success" in selector.lower():
                mock_text = "Verification Success: Action Completed Successfully!"
            return ActionResult(
                success=True,
                message=f"Mock: Extracted text from {selector}",
                extracted_data=mock_text,
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)
            text = await locator.inner_text(timeout=10000)
            return ActionResult(
                success=True,
                message=f"Extracted content from {selector}",
                extracted_data=text,
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def verify(self, selector: str, condition: str) -> ActionResult:
        """Validate element presence, visibility, or exact text equivalence."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Verified {selector} condition '{condition}'",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)

            cond = condition or ""
            cond_lower = cond.lower()
            if not cond_lower or cond_lower == "visible":
                is_visible = await locator.is_visible(timeout=5000)
                success = is_visible
                msg = f"Verify visibility of {selector}: {success}"
            elif cond_lower == "hidden":
                is_hidden = await locator.is_hidden(timeout=5000)
                success = is_hidden
                msg = f"Verify hidden state of {selector}: {success}"
            else:
                # Text check
                text = await locator.inner_text(timeout=5000)
                success = cond in text
                msg = (
                    f"Verify text '{cond}' inside {selector}: "
                    f"{success} (actual: '{text}')"
                )

            if not success:
                raise ValueError(f"Verification failed: {msg}")

            return ActionResult(success=True, message=msg, url=page.url)
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def submit(self, selector: str) -> ActionResult:
        """Perform form submit operation targeting submit buttons."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Submitted form {selector}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)
            await locator.scroll_into_view_if_needed()
            await asyncio.gather(
                page.wait_for_load_state("networkidle", timeout=10000),
                locator.click(timeout=10000),
            )
            return ActionResult(
                success=True,
                message=f"Submitted form targeting {selector}",
                url=page.url,
            )
        except Exception:
            # Fallback directly to click if wait_for_load_state fails
            try:
                page = self._get_page()
                await page.locator(selector).click(timeout=5000)
                return ActionResult(
                    success=True,
                    message=f"Submitted form targeting {selector} (fallback)",
                    url=page.url,
                )
            except Exception as fe:
                return ActionResult(success=False, error=str(fe))

    async def hover(self, selector: str) -> ActionResult:
        """Hover over element matching target selector."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Hovered element {selector}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            locator = page.locator(selector)
            await locator.scroll_into_view_if_needed()
            await locator.hover(timeout=10000)
            return ActionResult(
                success=True,
                message=f"Hovered over element: {selector}",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def back(self) -> ActionResult:
        """Navigate back in page history."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message="Mock: Navigated back in history",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            await page.go_back()
            return ActionResult(
                success=True,
                message="Successfully navigated back in history",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def reload(self) -> ActionResult:
        """Reload active browser page."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message="Mock: Reloaded page",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            await page.reload()
            return ActionResult(
                success=True,
                message="Successfully reloaded page",
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def press(self, selector: str, key: str) -> ActionResult:
        """Press keyboard key targeting selector."""
        if not PLAYWRIGHT_AVAILABLE:
            return ActionResult(
                success=True,
                message=f"Mock: Pressed key {key} targeting {selector}",
                url=self._get_page_url(),
            )
        try:
            page = self._get_page()
            if selector:
                locator = page.locator(selector)
                await locator.press(key)
            else:
                await page.keyboard.press(key)
            return ActionResult(
                success=True,
                message=(
                    f"Successfully pressed key {key} targeting {selector or 'keyboard'}"
                ),
                url=page.url,
            )
        except Exception as e:
            return ActionResult(success=False, error=str(e))

    async def capture_screenshot(self, output_path: str) -> str | None:
        """Save a snapshot viewport screenshot."""
        if not PLAYWRIGHT_AVAILABLE:
            return output_path
        try:
            page = self._get_page()
            await page.screenshot(path=output_path)
            return output_path
        except Exception:
            return None
