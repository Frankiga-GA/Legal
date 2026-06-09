"""Get full state of cases table."""
import os
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = os.getenv('SUPABASE_URL')
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
}

# Get ALL cases (no filter)
resp = httpx.get(
    f'{url}/rest/v1/cases?select=id,user_id,client_name&limit=100',
    headers=headers,
    timeout=15,
)
print(f'Status: {resp.status_code}')
print(f'Total: {len(resp.json())}')
print()
print('All rows:')
seen_keys = {}
for row in resp.json():
    key = (row['id'], row['user_id'])
    marker = ' <- DUPLICATE!' if key in seen_keys else ''
    print(f"  - id={row['id']:20s} | user={row['user_id'][:8]} | {row['client_name']}{marker}")
    seen_keys[key] = seen_keys.get(key, 0) + 1

print()
duplicates = {k: v for k, v in seen_keys.items() if v > 1}
if duplicates:
    print('DUPLICATE (id, user_id) pairs found:')
    for k, v in duplicates.items():
        print(f'  - {k}: {v} times')
else:
    print('No duplicate (id, user_id) pairs.')
