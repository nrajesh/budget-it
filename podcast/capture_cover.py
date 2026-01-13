from playwright.sync_api import sync_playwright
import time

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to match the component size (plus a bit to be safe, but we'll screenshot the element or full page)
        # The component is fixed 1200x630.
        context = browser.new_context(viewport={'width': 1200, 'height': 630})
        page = context.new_page()

        print("Navigating to page...")
        try:
            page.goto("http://localhost:8080/podcast-cover", timeout=60000)
            # Wait for the component to render (look for specific text)
            page.wait_for_selector("text=BUDGET IT!", timeout=10000)

            # Give it a second for any animations/fonts
            time.sleep(2)

            print("Taking screenshot...")
            page.screenshot(path="podcast/cover_image.png")
            print("Screenshot saved to podcast/cover_image.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    capture()
