import sqlite3

conn = sqlite3.connect("items.db")
cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS items")

cursor.execute("""
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    keywords TEXT,
    contact TEXT,
    image_path TEXT
)
""")

conn.commit()
conn.close()

print("Database initialized.")