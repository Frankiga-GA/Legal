import os
import base64
import httpx

from dotenv import load_dotenv
load_dotenv('backend/.env')

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    print("No GROQ_API_KEY")
    exit(1)

# Create a dummy image (1x1 transparent PNG)
dummy_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'

base64_image = base64.b64encode(dummy_png).decode("utf-8")

prompt = "Transcribe el texto visible en esta imagen."
payload = {
    "model": "meta-llama/llama-4-scout-17b-16e-instruct",
    "messages": [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{base64_image}"
                    }
                }
            ]
        }
    ],
    "temperature": 0.1,
    "max_tokens": 1024,
    "top_p": 1,
}

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
}

with httpx.Client(timeout=30) as client:
    response = client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
    
print("Status:", response.status_code)
print("Response:", response.text)
