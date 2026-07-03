# app/database/

Manages connections, schema migrations, and settings configurations for database storage engines.

## Directory Responsibilities

- `connection.py`: MongoDB Atlas connection setup, pooling, and health ping handlers.
- `indexes.py`: Programmatic index creation ensuring compound, unique, and TTL indices match configuration schemas.
- `migrations.py`: Orchestration scripts for safe database structure migration across deployment tiers.
