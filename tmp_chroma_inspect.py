import sqlite3
from pathlib import Path

base = Path(r'D:\hackthon\BFB-2.0-Team-Kinetix-\ml-backend')
chroma = base / 'data' / 'chroma_db' / 'chroma.sqlite3'
conn = sqlite3.connect(str(chroma))
cur = conn.cursor()
for table in ['collections', 'segments', 'embeddings', 'embedding_metadata']:
    print('\nTABLE', table)
    try:
        print(cur.execute(f'PRAGMA table_info({table})').fetchall())
    except Exception as exc:
        print('ERR', exc)
print('\nCOLLECTIONS')
try:
    print(cur.execute('SELECT * FROM collections LIMIT 20').fetchall())
except Exception as exc:
    print('ERR collections', exc)
print('\nSEGMENTS')
try:
    print(cur.execute('SELECT * FROM segments LIMIT 20').fetchall())
except Exception as exc:
    print('ERR segments', exc)
print('\nEMBEDDINGS')
try:
    print(cur.execute('SELECT COUNT(*) FROM embeddings').fetchone())
    print(cur.execute('SELECT * FROM embeddings LIMIT 5').fetchall())
except Exception as exc:
    print('ERR embeddings', exc)
conn.close()
