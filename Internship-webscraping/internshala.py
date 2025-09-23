import requests
from bs4 import BeautifulSoup

def get_internships(skill):
    # Internshala search URL
    url = f"https://internshala.com/internships/keywords-{skill}/"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                      "AppleWebKit/537.36 (KHTML, like Gecko)"
                      "Chrome/120.0.0.0 Safari/537.36"  # Pretend like a browser
    }
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(" Failed to retrieve data")
        return []
    
    soup = BeautifulSoup(response.text, "html.parser")
    internships = []

    # Each internship card
    for card in soup.find_all("div", class_="individual_internship"):
        title = card.find("h3", class_="heading_4_5").get_text(strip=True) if card.find("h3") else "N/A"
        company = card.find("h4", class_="heading_6").get_text(strip=True) if card.find("h4") else "N/A"
        location = card.find("a", class_="location_link").get_text(strip=True) if card.find("a", class_="location_link") else "N/A"
        
        internships.append({
            "title": title,
            "company": company,
            "location": location
        })
    
    return internships


if __name__ == "__main__":
    skill = input("Enter a skill: ").strip()
    results = get_internships(skill)
    
    if not results:
        print("No internships found or scraping blocked.")
    else:
        for i, internship in enumerate(results, 1):
            print(f"{i}. {internship['title']} at {internship['company']} ({internship['location']})")
