from tortoise.models import Model
from tortoise import fields


class BudgetItem(Model):
    id = fields.IntField(pk=True)
    event = fields.ForeignKeyField("models.Event", related_name="budget_items")
    category = fields.CharField(max_length=100)
    allocated = fields.DecimalField(max_digits=12, decimal_places=2, default=0)
    spent = fields.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "budget_items"
