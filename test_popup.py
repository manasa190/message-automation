import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

extension_path = r"c:\Users\Kavita\Downloads\linkdln message automation\linkdln message automation"

options = Options()
options.add_argument(f"--load-extension={extension_path}")
options.add_argument("--headless=new")

print("Launching Chrome to test the extension UI...")
driver = webdriver.Chrome(options=options)

try:
    driver.get("chrome://extensions")
    time.sleep(2)
    
    # Extract the extension ID from the extensions manager shadow DOM
    ext_id = driver.execute_script('''
        try {
            const manager = document.querySelector('extensions-manager');
            const itemList = manager.shadowRoot.querySelector('extensions-item-list');
            const items = itemList.shadowRoot.querySelectorAll('extensions-item');
            for (let item of items) {
                if (item.getAttribute('name') === 'LinkedIn Automation') {
                    return item.getAttribute('id');
                }
            }
        } catch(e) { return null; }
        return null;
    ''')

    if ext_id:
        print(f"Found Extension ID: {ext_id}")
        popup_url = f"chrome-extension://{ext_id}/popup.html"
        driver.get(popup_url)
        time.sleep(2)
        
        # Save screenshot
        screenshot_path = "popup_screenshot.png"
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot of the new Enterprise UI saved successfully to {screenshot_path}!")
    else:
        print("Could not find the extension ID in chrome://extensions")
except Exception as e:
    print(f"Error: {e}")
finally:
    driver.quit()
