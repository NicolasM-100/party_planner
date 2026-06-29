from tortoise.models import Model
from tortoise import fields


class Event(Model):
    id = fields.IntField(pk=True)
    title = fields.CharField(max_length=200)
    description = fields.TextField(default="")
    event_date = fields.DateField(null=True)
    location = fields.CharField(max_length=300, default="")
    budget_cap = fields.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = fields.CharField(
        max_length=20, default="planning"
    )
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    timeline_items: fields.ReverseRelation["TimelineItem"]
    vendors: fields.ReverseRelation["Vendor"]
    budget_items: fields.ReverseRelation["BudgetItem"]
    rsvps: fields.ReverseRelation["RSVP"]
    sustainability_metrics: fields.ReverseRelation["SustainabilityMetric"]

    class Meta:
        table = "events"
