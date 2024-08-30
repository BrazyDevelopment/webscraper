import requests
from bs4 import BeautifulSoup
import os
import time
from urllib.parse import urljoin, urlparse

# Directory to save assets
ASSETS_DIR = 'public'

# Fetch the webpage with retry logic
def fetch_with_retry(url, max_retries=float('inf'), initial_delay=10, max_delay=600):
    attempt = 0
    while attempt < max_retries:
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            # Check for Retry-After header
            if 'Retry-After' in response.headers:
                retry_after = int(response.headers['Retry-After'])
                time.sleep(retry_after)
            else:
                time.sleep(initial_delay)
            
            return response
        except requests.exceptions.RequestException as e:
            if response.status_code == 429:
                print(f"Attempt {attempt + 1} failed: {e}")
                delay = min(initial_delay * (2 ** attempt), max_delay)
                print(f"Waiting for {delay} seconds before next attempt.")
                time.sleep(delay)
                attempt += 1
            else:
                raise

def download_asset(url, base_url):
    response = fetch_with_retry(url)
    if response.status_code == 200:
        # Create directory structure
        parsed_url = urlparse(url)
        path = parsed_url.path
        if not path:
            path = '/'
        dir_name = os.path.dirname(path)
        if dir_name:
            os.makedirs(os.path.join(ASSETS_DIR, dir_name), exist_ok=True)
        
        # Save file
        file_name = os.path.basename(path)
        if not file_name:
            file_name = 'index.html'
        file_path = os.path.join(ASSETS_DIR, path)
        
        with open(file_path, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded: {file_path}")

# Main scraping function
def scrape_website(url):
    # Ensure ASSETS_DIR exists
    os.makedirs(ASSETS_DIR, exist_ok=True)
    
    response = fetch_with_retry(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Save HTML
    with open(os.path.join(ASSETS_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(str(soup))
    
    # Extract and download CSS
    for link in soup.find_all('link', rel='stylesheet'):
        if 'href' in link.attrs:
            css_url = urljoin(url, link['href'])
            download_asset(css_url, url)
    
    # Extract and download JavaScript
    for script in soup.find_all('script', src=True):
        js_url = urljoin(url, script['src'])
        download_asset(js_url, url)
    
    # Extract and download images
    for img in soup.find_all('img', src=True):
        img_url = urljoin(url, img['src'])
        download_asset(img_url, url)

# Run the scraper
url = "https://elmocoin.meme"
scrape_website(url)