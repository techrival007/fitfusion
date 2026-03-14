import asyncpg
import redis.asyncio as aioredis
from app.config import settings

_pool: asyncpg.Pool | None = None
_redis: aioredis.Redis | None = None


RUNTIME_SCHEMA_PATCHES = [
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS real_feel_c FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS visibility_km FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS wind_kph FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS wind_gust_kph FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS pressure_mb FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS cloud_cover_pct FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS precip_1h_mm FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS precipitation_type VARCHAR(30)",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS sleep_risk_score FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS env_stress_score FLOAT",
    "ALTER TABLE environmental_snapshots ADD COLUMN IF NOT EXISTS source_payload JSONB",
]


async def ensure_runtime_schema(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        for stmt in RUNTIME_SCHEMA_PATCHES:
            await conn.execute(stmt)


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.database_url, min_size=2, max_size=10
        )
        await ensure_runtime_schema(_pool)
    return _pool


async def get_redis() -> aioredis.Redis | None:
    global _redis
    if _redis is None:
        try:
            _redis = await aioredis.from_url(settings.redis_url, decode_responses=True)
            await _redis.ping()
        except Exception:
            _redis = None
    return _redis


async def get_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def close_connections():
    global _pool, _redis
    if _pool:
        await _pool.close()
        _pool = None
    if _redis:
        await _redis.aclose()
        _redis = None
