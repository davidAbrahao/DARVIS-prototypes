from alembic import context
from sqlalchemy import engine_from_config, pool

import app.models  # noqa: F401  (registra os modelos no metadata)
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import normalize_url

config = context.config
config.set_main_option("sqlalchemy.url", normalize_url(get_settings().database_url).replace("%", "%%"))
target_metadata = Base.metadata


def run_migrations_online() -> None:
    engine = engine_from_config(config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with engine.connect() as conn:
        context.configure(connection=conn, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


def run_migrations_offline() -> None:
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
