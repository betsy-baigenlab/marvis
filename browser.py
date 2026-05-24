from playwright.async_api import async_playwright

class BrowserClient:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None

    async def init_browser(self):
        if not self.playwright:
            self.playwright = await async_playwright().start()
            # Run headless for backend integration, but can be configured
            self.browser = await self.playwright.chromium.launch(headless=False)
            self.context = await self.browser.new_context()

    async def get_page_content(self, url: str) -> str:
        await self.init_browser()
        page = await self.context.new_page()
        try:
            await page.goto(url, wait_until="networkidle")
            # Extract main text content, simplifying for LLM context
            text = await page.evaluate("() => document.body.innerText")
            await page.close()
            # Truncate if too long
            return text[:5000]
        except Exception as e:
            if page:
                await page.close()
            return f"Error loading {url}: {e}"

    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

browser_client = BrowserClient()
