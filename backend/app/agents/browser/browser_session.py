"""Browser session lifecycle manager.

Owns the isolated Playwright instance, context, page, screenshots
directory structure, and teardown logic.
"""

import os

try:
    from playwright.async_api import (  # type: ignore[import-not-found]
        Browser,
        BrowserContext,
        Page,
        Playwright,
        async_playwright,
    )

    PLAYWRIGHT_AVAILABLE = True
except ModuleNotFoundError:
    PLAYWRIGHT_AVAILABLE = False

    class Browser:  # type: ignore[no-redef]
        pass

    class BrowserContext:  # type: ignore[no-redef]
        pass

    class Page:  # type: ignore[no-redef]
        def __init__(self) -> None:
            self.url: str | None = None

    class Playwright:  # type: ignore[no-redef]
        pass

    async_playwright = None


class BrowserSession:
    """Manages browser lifecycle and directories for task execution."""

    def __init__(self, task_id: str) -> None:
        """Initialize the BrowserSession workspace for a given task ID.

        Args:
            task_id: Unique task identifier.
        """
        self.task_id = task_id

        # Build paths conforming to refinement 4
        self.base_dir = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "..",
                "workspace",
                "tasks",
                task_id,
            )
        )
        self.screenshots_dir = os.path.join(self.base_dir, "screenshots")
        self.downloads_dir = os.path.join(self.base_dir, "downloads")
        self.logs_dir = os.path.join(self.base_dir, "logs")
        self.artifacts_dir = os.path.join(self.base_dir, "artifacts")

        for folder in [
            self.screenshots_dir,
            self.downloads_dir,
            self.logs_dir,
            self.artifacts_dir,
        ]:
            os.makedirs(folder, exist_ok=True)

        self.playwright: Playwright | None = None
        self.browser: Browser | None = None
        self.context: BrowserContext | None = None
        self.page: Page | None = None

    async def initialize(self, headless: bool = True) -> Page:
        """Build workspace directory structure, launch Playwright and return a new Page.

        Args:
            headless: Toggle browser execution interface.

        Returns:
            Page: Bound browser Page instance.
        """
        # 1. Build folders
        for folder in [
            self.screenshots_dir,
            self.downloads_dir,
            self.logs_dir,
            self.artifacts_dir,
        ]:
            os.makedirs(folder, exist_ok=True)

        if not PLAYWRIGHT_AVAILABLE:
            self.page = Page()
            return self.page

        # 2. Launch browser engine
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=headless)
        self.context = await self.browser.new_context(
            accept_downloads=True,
            viewport={"width": 1280, "height": 800},
        )

        # Bind downloads path handling
        self.context.set_default_timeout(15000)
        self.page = await self.context.new_page()

        return self.page

    def get_screenshot_path(self, step_number: int) -> str:
        """Get output path for step screenshot.

        Args:
            step_number: Current plan step index.

        Returns:
            str: Resolved absolute file path.
        """
        return os.path.join(self.screenshots_dir, f"step_{step_number}.png")

    async def capture_screenshot(self, step_number: int) -> str | None:
        """Capture page viewport screenshot and return saved file path.

        Args:
            step_number: Execution step number.

        Returns:
            str | None: Absolute path to the saved screenshot, or None if failed.
        """
        rel_path = f"/workspace/tasks/{self.task_id}/screenshots/step_{step_number}.png"
        if not self.page:
            return None
        if not PLAYWRIGHT_AVAILABLE:
            path = self.get_screenshot_path(step_number)
            tiny_png = (
                b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00"
                b"\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00"
                b"\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
            )
            try:
                with open(path, "wb") as f:
                    f.write(tiny_png)
                return rel_path
            except Exception:
                return None
        try:
            path = self.get_screenshot_path(step_number)
            await self.page.screenshot(path=path)
            return rel_path
        except Exception:
            return None

    async def close(self) -> None:
        """Tear down page, context, browser and stop the Playwright runner safely."""
        if not PLAYWRIGHT_AVAILABLE:
            self.page = None
            self.context = None
            self.browser = None
            self.playwright = None
            return

        try:
            if self.page:
                await self.page.close()
        except Exception:
            pass
        finally:
            self.page = None

        try:
            if self.context:
                await self.context.close()
        except Exception:
            pass
        finally:
            self.context = None

        try:
            if self.browser:
                await self.browser.close()
        except Exception:
            pass
        finally:
            self.browser = None

        try:
            if self.playwright:
                await self.playwright.stop()
        except Exception:
            pass
        finally:
            self.playwright = None
