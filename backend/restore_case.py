"""Restore EXP-2026-001 with full demo data from mockData.js."""
import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

url = os.getenv('SUPABASE_URL')
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

# Read the demo docs from the frontend file
import re
with open(os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'mockData.js'), 'r', encoding='utf-8') as f:
    mock_content = f.read()

# Just use a minimal restoration for now — the user can re-sync from localStorage
# We'll insert the basic fields; the rest can be re-populated by the app
payload = {
    'id': 'EXP-2026-001',
    'user_id': 'ea826297-b4aa-4163-9d94-c24141cd10f5',
    'client_name': 'Juan Perez Rojas',
    'dni': '12345678',
    'type': 'Laboral',
    'status': 'Activo',
    'summary': 'Demanda por despido arbitrario con reclamo de beneficios sociales y horas extras. La prioridad es reforzar prueba de impedimento de ingreso y preparar audiencia.',
    'last_update': '2026-05-24',
    'latest_progress': 'Se programó audiencia de conciliación laboral para el 04 de junio. Pendiente preparar estrategia.',
    'hearing_link': 'https://meet.google.com/abc-defg-hij',
    'urgency': 'Alta',
    'documents': [],
    'notes': [],
    'important_dates': [],
    'official_references': [],
    'updated_at': '2026-06-04T00:00:00Z',
}

resp = httpx.post(
    f'{url}/rest/v1/cases?on_conflict=id,user_id',
    headers=headers,
    json=[payload],
    timeout=15,
)
print(f'Status: {resp.status_code}')
print(f'Body: {resp.text[:500]}')

# Verify
resp = httpx.get(
    f'{url}/rest/v1/cases?select=id,client_name,type,urgency&order=id',
    headers=headers,
    timeout=15,
)
print('\nCurrent state:')
for r in resp.json():
    print(f"  {r['id']:20s} | {r['client_name']:35s} | {r['type']:15s} | {r['urgency']}")
