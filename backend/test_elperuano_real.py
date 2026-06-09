"""Test the real elperuano search endpoint."""
import httpx
import json

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

queries = ['despido arbitrario', 'SUNAT', 'pension alimenticia']

with httpx.Client(timeout=20.0, follow_redirects=True, headers={'User-Agent': USER_AGENT}) as client:
    for q in queries:
        url = f'https://www.elperuano.pe/portal/_SearchNews?pageIndex=1&pageSize=5&claves={q}'
        print(f'\n=== Query: {q}')
        print(f'  URL: {url}')
        r = client.get(url)
        print(f'  status: {r.status_code}')
        print(f'  content-type: {r.headers.get("content-type")}')
        try:
            data = r.json()
            print(f'  results: {len(data) if isinstance(data, list) else "?"}')
            if isinstance(data, list):
                for item in data[:3]:
                    print(f'    - [{item.get("Seccion")}] {item.get("vchTitulo", "")[:70]}')
                    print(f'      URL: ../{item.get("URLFriendLy", "")[:100]}')
                    print(f'      Date: {item.get("dtmFecha", "")[:40]}')
        except Exception as e:
            print(f'  parse error: {e}')
            print(f'  body (first 200): {r.text[:200]}')
