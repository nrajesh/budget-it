from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the Scheduled Transactions page
        page.goto("http://localhost:8081/scheduled")

        # Wait for the page to load
        page.wait_for_selector("body")

        # Check for the search input with the new aria-label
        # Using get_by_label to simulate user interaction via screen reader
        search_input = page.get_by_label("Search transactions")
        expect(search_input).to_be_visible()

        print("✅ Found search input with aria-label='Search transactions'")

        # Type something to trigger the clear button
        search_input.fill("Rent")

        # Check for the clear button with the new aria-label
        clear_button = page.get_by_label("Clear search")
        expect(clear_button).to_be_visible()

        print("✅ Found clear button with aria-label='Clear search'")

        # Take a screenshot
        page.screenshot(path="verification/accessibility_check.png")
        print("📸 Screenshot taken: verification/accessibility_check.png")

        browser.close()

if __name__ == "__main__":
    run()
