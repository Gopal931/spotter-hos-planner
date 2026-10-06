"""
URL Configuration for HOS app
"""

from django.urls import path
from .views import TripPlanView, HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health_check'),
    path('trips/plan/', TripPlanView.as_view(), name='trip_plan'),
]
