# Database

PostgreSQL via SQLAlchemy. Tables (see `backend/app/models/`):

users, exchanges, sectors, companies, stocks, market_data,
historical_prices, financials, news, news_sentiment, analyst_ratings,
watchlists, watchlist_stocks, paper_accounts, holdings, transactions,
alerts, ai_conversations.

Currently created via `Base.metadata.create_all()` on startup (see
`database.py::init_db`) for fast iteration. Before this schema stabilizes
for a real deployment, switch to Alembic:

```bash
cd backend
pip install alembic
alembic init database/migrations
# point alembic.ini / env.py at app.database.Base and DATABASE_URL
alembic revision --autogenerate -m "init"
alembic upgrade head
```

`database/seed.py` populates the demo company universe (matching
`mock_provider.UNIVERSE`) and a `demo@marketai.local` user so the API is
immediately exercisable.
