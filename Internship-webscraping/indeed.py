import requests
from bs4 import BeautifulSoup


def get_indeed_jobs(skill_query, location=""):
    # Format the search query for Indeed
    base_url = "https://in.indeed.com/jobs"
    params = {
        "q": skill_query,
        "l": location
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0.0.0 Safari/537.36"
    }

    response = requests.get(base_url, params=params, headers=headers)
    if response.status_code != 200:
        print("Failed to retrieve jobs")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    jobs = []

    for job_card in soup.find_all("div", class_="job_seen_beacon"):
        title_tag = job_card.find("h2", class_="jobTitle")
        company_tag = job_card.find("span", class_="companyName")
        location_tag = job_card.find("div", class_="companyLocation")
        summary_tag = job_card.find("div", class_="job-snippet")

        job = {
            "title": title_tag.get_text(strip=True) if title_tag else None,
            "company": company_tag.get_text(strip=True) if company_tag else None,
            "location": location_tag.get_text(strip=True) if location_tag else None,
            "summary": summary_tag.get_text(" ", strip=True) if summary_tag else None,
            "link": "https://in.indeed.com" + title_tag.find("a")["href"] if title_tag and title_tag.find("a") else None
        }
        jobs.append(job)

    return jobs


if __name__ == "__main__":
    skill = input("Enter skill or job role to search: ")
    listings = get_indeed_jobs(skill)

    for i, job in enumerate(listings, 1):
        print(f"\nJob {i}:")
        print(f"Title: {job['title']}")
        print(f"Company: {job['company']}")
        print(f"Location: {job['location']}")
        print(f"Summary: {job['summary']}")
        print(f"Link: {job['link']}")
