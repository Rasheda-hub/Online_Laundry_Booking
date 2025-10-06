from neo4j import GraphDatabase
from config import settings

_driver = None

def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),  # Aura uses tuple auth
            max_connection_pool_size=10,
        )
    return _driver

def get_session():
    """Return a session bound to the configured database (Aura requires explicit database)."""
    return get_driver().session(database=settings.neo4j_database)

def close_driver():
    global _driver
    if _driver:
        _driver.close()
        _driver = None
