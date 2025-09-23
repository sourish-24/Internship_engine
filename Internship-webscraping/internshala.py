from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time

def get_internships(skill):
    url = f"https://internshala.com/internships/keywords-{skill.replace(' ', '-')}/"
    
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")   # modern headless mode
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get(url)

    # Scroll to load internships
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(5)

    html = driver.page_source
    driver.quit()

    soup = BeautifulSoup(html, "html.parser")
    cards = soup.find_all("div", class_="individual_internship")

    internships = []
    for card in cards:
        # Title
        title = card.select_one("h3.job-internship-name a.job-title-href")
        # Company
        company = card.select_one("p.company-name")
        # Location
        location = card.select_one("div.row-1-item.locations a")
        # Stipend
        stipend = card.select_one("span.stipend")
        # Duration
        duration = None
        for row in card.select("div.row-1-item span"):
            if "Month" in row.get_text() or "Week" in row.get_text():
                duration = row
                break
        # Job Description
        about = card.select_one("div.about_job div.text")
        # Skills
        skills = [s.get_text(strip=True) for s in card.select("div.job_skills div.job_skill")]

        internships.append({
            "title": title.get_text(strip=True) if title else "N/A",
            "company": company.get_text(strip=True) if company else "N/A",
            "location": location.get_text(strip=True) if location else "N/A",
            "stipend": stipend.get_text(strip=True) if stipend else "N/A",
            "duration": duration.get_text(strip=True) if duration else "N/A",
            "about": about.get_text(" ", strip=True) if about else "N/A",
            "skills": skills if skills else []
        })
    
    return internships


if __name__ == "__main__":
    skill = input("Enter a skill: ").strip()
    results = get_internships(skill)
    
    if not results:
        print("No internships found.")
    else:
        for i, internship in enumerate(results, 1):
            print(f"{i}. {internship['title']} at {internship['company']} ({internship['location']})")
            print(f"   Stipend: {internship['stipend']} | Duration: {internship['duration']}")
            print(f"   Skills: {', '.join(internship['skills']) if internship['skills'] else 'N/A'}")
            print(f"   About: {internship['about'][:200]}...")  # print first 200 chars only
            print("-" * 80)
