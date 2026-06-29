from tortoise.models import Model
from tortoise import fields


class TimelineItem(Model):
    id = fields.IntField(pk=True)
    event = fields.ForeignKeyField("models.Event", related_name="timeline_items")
    title = fields.CharField(max_length=200)
    event_datetime = fields.DatetimeField(null=True)
    completed = fields.BooleanField(default=False)
    sort_order = fields.IntField(default=0)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "timeline_items"
        ordering = ["sort_order", "event_datetime"]
