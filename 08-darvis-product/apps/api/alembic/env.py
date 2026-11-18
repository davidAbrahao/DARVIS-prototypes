from alembic import context
from sqlalchemy import engine_from_config, pool

from app.db.base import Base
from app.db.session import build_database_url
from app import models  # noqa: F401

config = context.config
target_metadata = Base.metadata
url = build_database_url()
if url:
    config.set_main_option("sqlalchemy.url", url.replace("%", "%%"))


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    section = config.get_section(config.config_ini_section) or {}
    connectable = engine_from_config(section, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
elif not url:
    raise RuntimeError("DATABASE_URL deve estar configurada para executar migrações")
else:
    run_migrations_online()
