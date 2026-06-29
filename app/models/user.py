from tortoise.models import Model
from tortoise import fields


class User(Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=100, unique=True)
    email = fields.CharField(max_length=200, unique=True)
    password_hash = fields.CharField(max_length=200)
    session_token = fields.CharField(max_length=200, null=True, unique=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "users"
