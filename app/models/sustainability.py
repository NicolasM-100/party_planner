from tortoise.models import Model
from tortoise import fields


class SustainabilityMetric(Model):
    id = fields.IntField(pk=True)
    event = fields.ForeignKeyField(
        "models.Event", related_name="sustainability_metrics"
    )
    carbon_offset_kg = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    local_sourcing_pct = fields.DecimalField(max_digits=5, decimal_places=2, default=0)
    waste_reduction_kg = fields.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "sustainability_metrics"
