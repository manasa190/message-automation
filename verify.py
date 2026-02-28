import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

extension_path = r"c:\Users\Kavita\Downloads\linkdln message automation\linkdln message automation"

options = Options()
options.add_argument(f"--load-extension={extension_path}")
# Prevent browser from closing automatically right away
options.add_experimental_option("detach", True)

print("Launching Chrome with the unpacked extension...")
driver = webdriver.Chrome(options=options)

print("Navigating to LinkedIn...")
driver.get("https://www.linkedin.com/login")

email = "linkdin-manasasanjay4@gmail.com"
password = "manu262004"

print("Logging in...")
try:
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "username"))
    ).send_keys(email)
    
    driver.find_element(By.ID, "password").send_keys(password)
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    
    # Wait for login to complete by looking for the global nav or search box
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.ID, "global-nav-search"))
    )
    print("Login successful!")
except Exception as e:
    print("Login failed or took too long. Please complete login manually if a captcha appeared.")

print("To start the extension:")
print("1. Click the 'Extensions' puzzle icon in the top right of the Chrome toolbar.")
print("2. Click 'LinkedIn Automation'.")
print("3. Click 'Start'.")

# Try to find the extension ID to open its popup in a tab
try:
    driver.get("chrome://extensions")
    time.sleep(2)
    # This might require some DOM reading if in developer mode, but we can just leave it to the user.
except:
    pass
