"""Check current user and case ownership in Supabase using REST API."""
import os
import sys
import json
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = os.getenv('SUPABASE_URL')
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not service_key:
    print('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    sys.exit(1)

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
}

# List users via admin API
print('=' * 60)
print('USERS in auth.users (via admin list):')
resp = httpx.get(f'{url}/auth/v1/admin/users', headers=headers, timeout=15)
if resp.status_code != 200:
    print(f'  ERROR: {resp.status_code} {resp.text[:200]}')
else:
    data = resp.json()
    users = data.get('users', [])
    for u in users:
        print(f"  - id={u['id']}  email={u.get('email')}  created={u.get('created_at')}")
    if not users:
        print('  (no users found)')

# Get all cases
print()
print('=' * 60)
print('CASES in public.cases:')
resp = httpx.get(f'{url}/rest/v1/cases?select=id,user_id,client_name,last_update,urgency', headers=headers, timeout=15)
if resp.status_code != 200:
    print(f'  ERROR: {resp.status_code} {resp.text[:200]}')
else:
    cases = resp.json()
    for c in cases:
        print(f"  - {c['id']:20s} | user_id={c['user_id']} | {c['client_name']} | urg={c['urgency']}")
    if not cases:
        print('  (no cases found)')

    # Check orphans
    user_ids = {u['id'] for u in users}
    print()
    print('=' * 60)
    print('OWNERSHIP:')
    for c in cases:
        marker = 'OK' if c['user_id'] in user_ids else 'ORPHAN (no matching user)'
        print(f"  {marker}: {c['id']} -> {c['user_id']}")
