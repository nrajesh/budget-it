from playwright.sync_api import sync_playwright
import time

def extract_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # We assume the server is still running on port 8080 from previous steps.
            # If not, we might need to restart it, but usually it persists in the sandbox session
            # if started with & (though sometimes killed between turns? Let's assume it might be gone and check).
            # Actually, I'll just try to hit it.

            page.goto("http://localhost:8080/podcast-cover", timeout=30000)
            page.wait_for_selector("text=BUDGET IT!", timeout=10000)

            # Get the HTML of the main component.
            # The component has a specific class or structure.
            # Based on the code: <div className="w-[1200px] ...">
            # We can select the first div that matches the width or just the root #root > div

            # Let's get the content of the #root div, or the specific component div.
            # The component is mounted directly in the route, so it should be inside the Outlet or just direct.
            # Let's grab the element that contains "BUDGET IT!" and go up to its main container.

            element = page.locator("text=BUDGET IT!").locator("xpath=./ancestor::div[contains(@class, 'w-[1200px]')]")
            html_content = element.evaluate("el => el.outerHTML")

            with open("podcast/podcast_cover_rendered.html", "w") as f:
                f.write(html_content)

            print("HTML saved to podcast/podcast_cover_rendered.html")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    extract_html()
