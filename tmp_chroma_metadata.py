import sqlite3
from pathlib import Path

conn = sqlite3.connect(r'D:\hackthon\BFB-2.0-Team-Kinetix-\ml-backend\data\chroma_db\chroma.sqlite3')
cur = conn.cursor()
print('METADATA sample for first 20 rows')
for row in cur.execute('SELECT * FROM embedding_metadata LIMIT 20').fetchall():
    print(row)
print('DISTINCT keys', cur.execute('SELECT key, COUNT(*) FROM embedding_metadata GROUP BY key ORDER BY COUNT(*) DESC LIMIT 20').fetchall())
conn.close()
