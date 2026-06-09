"""Inspect elperuano.pe buscador to find actual search endpoint."""
import httpx
import re

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

with httpx.Client(timeout=20.0, follow_redirects=True, headers={"User-Agent": USER_AGENT}) as client:
    r = client.get("https://www.elperuano.pe/portal/buscador")
    html = r.text
    print(f"Status: {r.status_code}, final: {r.url}")
    print(f"Length: {len(html)}")
    print()

    # Look for forms
    print("=== Forms found ===")
    forms = re.findall(r'<form[^>]*action="([^"]*)"[^>]*method="([^"]*)"', html)
    for action, method in forms:
        print(f"  method={method} action={action[:120]}")
    forms2 = re.findall(r'<form[^>]*method="([^"]*)"[^>]*action="([^"]*)"', html)
    for method, action in forms2:
        print(f"  method={method} action={action[:120]}")

    # Look for API endpoints in JS
    print()
    print("=== JS search hints ===")
    for pattern in [r'"/api/[^"]+"', r'"/busqueda[^"]*"', r'"/buscar[^"]*"', r'fetch\([\'"]([^\'"]+)[\'"]\)', r'axios\.[get|post]\([\'"]([^\'"]+)[\'"]\)']:
        for m in re.findall(pattern, html)[:10]:
            print(f"  {pattern[:20]}: {m[:100]}")

    # Look for any /portal/ or /busqueda or /buscar URLs
    print()
    print("=== Portal/buscar URLs in page ===")
    for m in re.findall(r'[\'"](\/(?:portal|buscar|busqueda|api|search)[^\'"]*)[\'"]', html)[:20]:
        print(f"  {m[:120]}")

    # Look for input names
    print()
    print("=== Input names ===")
    for m in re.findall(r'<input[^>]*name="([^"]+)"', html)[:20]:
        print(f"  {m}")

    # Look for fetch/XHR endpoints near "search" or "buscar"
    print()
    print("=== Search/buscar substrings ===")
    for m in re.findall(r'[\'"][^\'"]*(?:buscar|search|query)[^\'"]*[\'"]', html)[:20]:
        print(f"  {m[:120]}")
