"""Check current constraints and indexes on public.cases."""
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

# Try to get the current state by attempting operations
# 1. Try to insert a case with id=EXP-2026-001 and user_id=luis's id (different from juan)
print('Testing conflict scenarios...')
print()

# Read users
resp = httpx.get(f'{url}/auth/v1/admin/users', headers=headers, timeout=15)
users = resp.json().get('users', [])
juan_id = next((u['id'] for u in users if 'juan' in u.get('email', '')), None)
luis_id = next((u['id'] for u in users if 'luis' in u.get('email', '')), None)
print(f'juan_id: {juan_id}')
print(f'luis_id: {luis_id}')
print()

# Read all cases
resp = httpx.get(f'{url}/rest/v1/cases?select=id,user_id,client_name', headers=headers, timeout=15)
cases = resp.json()
print(f'Total cases: {len(cases)}')
for c in cases:
    print(f"  - {c['id']:20s} | user={c['user_id'][:8]}... | {c['client_name']}")
print()

# Try to insert a case with same id as juan's but different user (luis)
print('Trying INSERT with same id, different user_id (expecting success with composite PK):')
test_payload = {
    'id': 'TEST-CONFLICT-001',
    'user_id': luis_id,
    'client_name': 'TEST LUIS',
    'dni': 'TEST',
    'type': 'TEST',
    'status': 'Activo',
    'summary': '',
    'last_update': '2026-06-04',
    'latest_progress': '',
    'hearing_link': '',
    'urgency': 'Media',
    'documents': [],
    'notes': [],
    'important_dates': [],
    'official_references': [],
    'updated_at': '2026-06-04T00:00:00Z',
}
resp = httpx.post(
    f'{url}/rest/v1/cases',
    headers={**headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
    json=[test_payload],
    timeout=15,
)
print(f'  status: {resp.status_code}')
if resp.status_code in (200, 201):
    print('  -> Success! Composite PK works.')
else:
    print(f'  -> Failed: {resp.text[:300]}')

# Now try inserting ANOTHER one with the same id (TEST-CONFLICT-001) for luis
print()
print('Trying to insert DUPLICATE (same id, same user):')
resp = httpx.post(
    f'{url}/rest/v1/cases',
    headers={**headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
    json=[test_payload],
    timeout=15,
)
print(f'  status: {resp.status_code}')
if resp.status_code == 409:
    print('  -> 409 Conflict (as expected with composite PK)')
else:
    print(f'  -> {resp.text[:300]}')

# Cleanup: delete the test row
httpx.delete(
    f'{url}/rest/v1/cases?id=eq.TEST-CONFLICT-001',
    headers=headers,
    timeout=15,
)
print('  (cleaned up)')
