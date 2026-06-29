from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    neon_database_url: str
    replicate_api_token: str = ""

    class Config:
        env_file = ".env"

    @property
    def db_url(self) -> str:
        url = self.neon_database_url
        for bad in ("postgresql://", "postgres://", "postgre://"):
            if url.startswith(bad):
                url = "postgres://" + url[len(bad):]
                break
        # asyncpg doesn't support sslmode in query string
        if "?sslmode=" in url:
            url = url.split("?sslmode=")[0]
        return url


settings = Settings()
