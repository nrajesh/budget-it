from playwright.sync_api import sync_playwright
import time
import sys

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to match the component size (1200x800)
        context = browser.new_context(viewport={'width': 1200, 'height': 800})
        page = context.new_page()

        url = "http://localhost:8081/app-infographic"
        print(f"Navigating to {url}...")
        try:
            page.goto(url, timeout=60000)
            # Wait for the component to render (look for specific text)
            page.wait_for_selector("text=BUDGET IT!", timeout=10000)

            # Give it a second for any animations/fonts
            time.sleep(2)

            print("Taking screenshot...")
            page.screenshot(path="podcast/infographic_image.png")
            print("Screenshot saved to podcast/infographic_image.png")
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    capture()
