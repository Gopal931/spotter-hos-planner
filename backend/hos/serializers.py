"""
Django REST Framework Serializers for HOS Trip Planner
"""

from rest_framework import serializers


class TripPlanRequestSerializer(serializers.Serializer):
    """
    Validates input parameters for planning a truck driver HOS trip.
    """
    current_location = serializers.CharField(
        max_length=255,
        required=True,
        error_messages={
            "required": "Current location is required.",
            "blank": "Current location cannot be empty.",
        }
    )
    pickup_location = serializers.CharField(
        max_length=255,
        required=True,
        error_messages={
            "required": "Pickup location is required.",
            "blank": "Pickup location cannot be empty.",
        }
    )
    dropoff_location = serializers.CharField(
        max_length=255,
        required=True,
        error_messages={
            "required": "Dropoff location is required.",
            "blank": "Dropoff location cannot be empty.",
        }
    )
    cycle_used_hours = serializers.FloatField(
        required=False,
        default=0.0,
        min_value=0.0,
        max_value=70.0,
        error_messages={
            "min_value": "Current cycle used hours cannot be negative.",
            "max_value": "Current cycle used hours cannot exceed 70.0 hours (70-hr / 8-day rule).",
            "invalid": "Please enter a valid numeric value for cycle used hours.",
        }
    )
    start_time = serializers.DateTimeField(
        required=False,
        allow_null=True,
        default=None,
    )

    def validate_current_location(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Current location cannot be empty.")
        return val

    def validate_pickup_location(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Pickup location cannot be empty.")
        return val

    def validate_dropoff_location(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Dropoff location cannot be empty.")
        return val
