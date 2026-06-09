"""Inspect actual constraints on public.cases."""
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

# Try to query pg_catalog via an RPC or by introspecting via REST
# PostgREST exposes the schema info through /rest/v1/ introspection
# But we can use a workaround: try an INSERT with on_conflict

# Try the actual problematic operation:
# Insert a case with same id, same user_id twice
print('=== Test 1: Insert duplicate for juan ===')
test = {
    'id': 'EXP-2026-001',
    'user_id': 'ea826297-b4aa-4163-9d94-c24141cd10f5',
    'client_name': 'TEST',
    'dni': '',
    'type': '',
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
    f'{url}/rest/v1/cases?on_conflict=id',
    headers={**headers, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal'},
    json=[test],
    timeout=15,
)
print(f'  status: {resp.status_code}')
print(f'  body: {resp.text[:300]}')
print()

# Try insert with on_conflict=id,user_id
print('=== Test 2: Insert duplicate for juan with on_conflict=id,user_id ===')
resp = httpx.post(
    f'{url}/rest/v1/cases?on_conflict=id,user_id',
    headers={**headers, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal'},
    json=[test],
    timeout=15,
)
print(f'  status: {resp.status_code}')
print(f'  body: {resp.text[:300]}')
print()

# Check actual current state
print('=== All rows for EXP-2026-001 ===')
resp = httpx.get(
    f'{url}/rest/v1/cases?id=eq.EXP-2026-001&select=*',
    headers=headers,
    timeout=15,
)
print(f'  status: {resp.status_code}')
for row in resp.json():
    print(f'  - id={row["id"]}, user_id={row["user_id"]}, client_name={row["client_name"]}')
print()

# Try to insert a completely new id
print('=== Test 3: Insert brand new id ===')
test3 = {**test, 'id': 'TEST-NEW-001', 'client_name': 'BRAND NEW'}
resp = httpx.post(
    f'{url}/rest/v1/cases',
    headers={**headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
    json=[test3],
    timeout=15,
)
print(f'  status: {resp.status_code}')
print(f'  body: {resp.text[:200]}')
httpx.delete(
    f'{url}/rest/v1/cases?id=eq.TEST-NEW-001',
    headers=headers,
    timeout=15,
)
