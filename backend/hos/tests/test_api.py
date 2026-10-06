"""
Integration tests for Trip Planning REST API endpoints.
"""

import pytest
from rest_framework.test import APIClient
from rest_framework import status


@pytest.mark.django_db
class TestTripAPI:
    @pytest.fixture
    def client(self):
        return APIClient()

    def test_health_check_endpoint(self, client):
        response = client.get('/api/health/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "online"

    def test_plan_trip_valid_request(self, client):
        payload = {
            "current_location": "New York, NY",
            "pickup_location": "Philadelphia, PA",
            "dropoff_location": "Chicago, IL",
            "cycle_used_hours": 30.0,
        }
        response = client.post('/api/trips/plan/', payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["success"] is True
        assert "summary" in data
        assert "route" in data
        assert "schedule" in data
        assert "daily_logs" in data
        assert "compliance" in data
        assert len(data["daily_logs"]) >= 1

    def test_plan_trip_negative_cycle_hours_validation(self, client):
        payload = {
            "current_location": "New York, NY",
            "pickup_location": "Philadelphia, PA",
            "dropoff_location": "Chicago, IL",
            "cycle_used_hours": -5.0,
        }
        response = client.post('/api/trips/plan/', payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False

    def test_plan_trip_over_70_cycle_hours_validation(self, client):
        payload = {
            "current_location": "New York, NY",
            "pickup_location": "Philadelphia, PA",
            "dropoff_location": "Chicago, IL",
            "cycle_used_hours": 75.0,
        }
        response = client.post('/api/trips/plan/', payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False

    def test_plan_trip_empty_locations_validation(self, client):
        payload = {
            "current_location": "",
            "pickup_location": "Philadelphia, PA",
            "dropoff_location": "Chicago, IL",
        }
        response = client.post('/api/trips/plan/', payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["success"] is False
