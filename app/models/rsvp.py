from tortoise.models import Model
from tortoise import fields


class RSVP(Model):
    id = fields.IntField(pk=True)
    event = fields.ForeignKeyField("models.Event", related_name="rsvps")
    guest_name = fields.CharField(max_length=200)
    email = fields.CharField(max_length=200, default="")
    status = fields.CharField(
        max_length=20, default="pending"
    )
    plus_ones = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "rsvps"
