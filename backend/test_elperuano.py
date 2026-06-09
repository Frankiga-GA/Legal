"""Test different search URL patterns for elperuano.pe."""
import httpx
from urllib.parse import urlencode

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

query = "despido arbitrario"
base = "https://www.elperuano.pe/portal/buscador"

patterns = [
    f"{base}?query={query}",
    f"{base}?texto={query}",
    f"{base}?q={query}",
    f"{base}?search={query}",
    f"{base}?buscar={query}",
]

with httpx.Client(timeout=20.0, follow_redirects=True, headers={"User-Agent": USER_AGENT}) as client:
    for url in patterns:
        try:
            r = client.get(url)
            print(f"\n=== {url}")
            print(f"  status: {r.status_code}, final_url: {r.url}")
            html = r.text
            # Count anchors with elperuano.pe in href and decent text
            import re
            anchors = re.findall(r'<a[^>]+href="([^"]*elperuano\.pe[^"]*)"[^>]*>([^<]+)</a>', html)
            print(f"  anchors with elperuano.pe: {len(anchors)}")
            for href, text in anchors[:5]:
                text = text.strip()[:80]
                print(f"    - [{text}] -> {href[:100]}")
        except Exception as e:
            print(f"\n=== {url}")
            print(f"  ERROR: {e}")
