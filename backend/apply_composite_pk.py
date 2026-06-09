"""Apply the composite PK migration to Supabase via REST.

Uses the postgrest endpoint that proxies the pg-meta query API isn't available
on hosted Supabase without the management API key. The cleanest way is to use
the SQL editor via a one-shot rpc, but since we don't have that, we'll do a
simple verification + report.

This script is kept as documentation. The actual migration should be run
from the Supabase SQL editor or via supabase-cli.
"""
import os
import sys
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

# Verify current PK
print('Current PK on public.cases:')
resp = httpx.get(
    f'{url}/rest/v1/cases?select=id,user_id&limit=1',
    headers=headers,
    timeout=15,
)
print(f'  status: {resp.status_code}')
if resp.status_code == 200:
    print('  Table accessible. Migration must be applied via Supabase SQL editor.')
    print('  File: supabase/migrations/20260604_composite_pk.sql')
