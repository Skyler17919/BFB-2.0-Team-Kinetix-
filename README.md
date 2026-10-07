# Skill Navigator

skillvector/

├── .streamlit/

│   ├── config.toml         # Theme settings (dark mode, primary colors)

│   └── secrets.toml        # Supabase credentials (SUPABASE_URL, SUPABASE_KEY)

├── data/                   # Parquet files will go here later

├── services/

│   ├── __init__.py

│   ├── mock_engine.py      # Developer 2 writes mock responses here

│   └── supabase_client.py  # Supabase client initialization & queries

├── app.py                  # Main Streamlit UI layout

├── requirements.txt

└── .gitignore

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2d42247f-79ec-4f55-ba89-b1340be91890).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
