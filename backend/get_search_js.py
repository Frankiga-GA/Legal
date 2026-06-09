"""Get elperuano search.js."""
import httpx

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
r = httpx.get('https://www.elperuano.pe/static/corejs/search.js?v20260227', headers={'User-Agent': USER_AGENT}, timeout=20)
print(f'Status: {r.status_code}, length: {len(r.text)}')
with open(r'C:\Users\jga47\OneDrive\Desktop\Legal\backend\elperuano_search.js', 'w', encoding='utf-8') as f:
    f.write(r.text)
print('Saved')
