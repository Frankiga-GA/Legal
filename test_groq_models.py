import os
import httpx

from dotenv import load_dotenv
load_dotenv('backend/.env')

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    print("No GROQ_API_KEY")
    exit(1)

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}

with httpx.Client(timeout=30) as client:
    response = client.get("https://api.groq.com/openai/v1/models", headers=headers)
    
data = response.json()
models = [m['id'] for m in data.get('data', [])]
for m in models:
    print(m)
