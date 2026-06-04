"""Verifica que los datos de expedientes estan persistidos en Supabase."""
import os
import json
import httpx
from dotenv import dotenv_values

env = dotenv_values(os.path.join(os.path.dirname(__file__), '.env'))
url = env['SUPABASE_URL']
key = env['SUPABASE_SERVICE_ROLE_KEY']

r = httpx.get(
    f'{url}/rest/v1/cases',
    params={
        'select': 'id,client_name,dni,type,status,summary,latest_progress,urgency,documents,notes,important_dates,official_references,updated_at,last_update',
        'order': 'updated_at.desc',
        'limit': '3',
    },
    headers={'apikey': key, 'Authorization': f'Bearer {key}'},
    timeout=10,
)
print('Status:', r.status_code)
print()
for row in r.json():
    print('=' * 60)
    for k, v in row.items():
        if isinstance(v, (list, dict)):
            text = json.dumps(v, ensure_ascii=False)
            if len(text) > 200:
                text = text[:200] + ' ...'
            print(f'  {k}: {text}')
        else:
            print(f'  {k}: {v}')
print()
print('Total cases:', len(r.json()))
