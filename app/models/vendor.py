from tortoise.models import Model
from tortoise import fields


class Vendor(Model):
    id = fields.IntField(pk=True)
    event = fields.ForeignKeyField("models.Event", related_name="vendors")
    name = fields.CharField(max_length=200)
    category = fields.CharField(max_length=100, default="")
    contact = fields.CharField(max_length=200, default="")
    cost = fields.DecimalField(max_digits=12, decimal_places=2, default=0)
    eco_verified = fields.BooleanField(default=False)
    notes = fields.TextField(default="")
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "vendors"
