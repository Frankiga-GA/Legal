"""Try to introspect constraints on cases via a SQL query through the REST API.

We can use the rpc endpoint if there's a function, or we can use the
information_schema tables via the postgrest introspection. But postgrest
doesn't expose system catalogs by default. Let me just try a direct
psycopg2 connection if available, otherwise fall back to checking via
conflict scenarios.
"""
import os
import sys
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = os.getenv('SUPABASE_URL')
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
}

# Try to find a SQL execution endpoint. The hosted Supabase doesn't have
# a direct SQL endpoint accessible via the REST API without the management
# key. Let me check the project URL structure.

# The hosted Supabase has a /pg endpoint for direct DB connections,
# but it requires the DB connection string which we don't have.

# Alternative: use the postgrest introspection tables. With the service
# role key we can query information_schema.

print('=== Test 1: Query information_schema for unique constraints ===')
resp = httpx.get(
    f'{url}/rest/v1/information_schema.table_constraints?table_name=eq.cases&constraint_type=eq.UNIQUE&select=*',
    headers=headers,
    timeout=15,
)
print(f'  status: {resp.status_code}')
print(f'  body: {resp.text[:500]}')
print()

print('=== Test 2: Query information_schema for primary key ===')
resp = httpx.get(
    f'{url}/rest/v1/information_schema.table_constraints?table_name=eq.cases&constraint_type=eq.PRIMARY KEY&select=*',
    headers=headers,
    timeout=15,
)
print(f'  status: {resp.status_code}')
print(f'  body: {resp.text[:500]}')
print()

print('=== Test 3: Query pg_indexes ===')
resp = httpx.get(
    f'{url}/rest/v1/pg_indexes?tablename=eq.cases&select=indexname,indexdef',
    headers=headers,
    timeout=15,
)
print(f'  status: {resp.status_code}')
print(f'  body: {resp.text[:800]}')
print()

# Test: send a multi-row INSERT to see if it's self-conflicting
print('=== Test 4: Insert 2 rows with same id, different user (composite test) ===')
test = {
    'id': 'TEST-1234',
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
    f'{url}/rest/v1/cases',
    headers={**headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
    json=[test, test],
    timeout=15,
)
print(f'  status: {resp.status_code}')
print(f'  body: {resp.text[:200]}')
httpx.delete(
    f'{url}/rest/v1/cases?id=eq.TEST-1234',
    headers=headers,
    timeout=15,
)
