"""
REST API Views for Spotter HOS Trip Planning
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TripPlanRequestSerializer
from .routing import geocode_location, get_route_between
from .scheduler import HOSTripScheduler

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """Simple healthcheck endpoint."""
    def get(self, request):
        return Response({
            "status": "online",
            "service": "Spotter HOS Trip Planner API",
            "version": "1.0.0",
        })


class TripPlanView(APIView):
    """
    POST /api/trips/plan/
    Receives trip parameters, computes route geometry via OSRM,
    applies FMCSA HOS regulations, and outputs compliant schedule + ELD daily logs.
    """

    def post(self, request):
        serializer = TripPlanRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": "Validation failed",
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        curr_query = data["current_location"]
        pickup_query = data["pickup_location"]
        dropoff_query = data["dropoff_location"]
        cycle_used = data.get("cycle_used_hours", 0.0)
        start_time = data.get("start_time")

        # 1. Geocode locations
        try:
            curr_loc = geocode_location(curr_query)
        except ValueError as e:
            return Response(
                {"success": False, "error": f"Invalid Current Location: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pickup_loc = geocode_location(pickup_query)
        except ValueError as e:
            return Response(
                {"success": False, "error": f"Invalid Pickup Location: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            dropoff_loc = geocode_location(dropoff_query)
        except ValueError as e:
            return Response(
                {"success": False, "error": f"Invalid Dropoff Location: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Calculate Routes for Leg 1 (Current -> Pickup) and Leg 2 (Pickup -> Dropoff)
        try:
            leg1_route = get_route_between(
                lat1=curr_loc["lat"],
                lon1=curr_loc["lng"],
                lat2=pickup_loc["lat"],
                lon2=pickup_loc["lng"],
            )
            leg2_route = get_route_between(
                lat1=pickup_loc["lat"],
                lon1=pickup_loc["lng"],
                lat2=dropoff_loc["lat"],
                lon2=dropoff_loc["lng"],
            )
        except Exception as e:
            logger.error(f"Routing calculation failed: {e}", exc_info=True)
            return Response(
                {"success": False, "error": f"Failed to compute route: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # 3. Execute HOS Simulation & ELD Log Generation
        try:
            scheduler = HOSTripScheduler(
                current_loc=curr_loc,
                pickup_loc=pickup_loc,
                dropoff_loc=dropoff_loc,
                leg1_route=leg1_route,
                leg2_route=leg2_route,
                current_cycle_used=cycle_used,
                start_datetime=start_time,
            )
            plan_result = scheduler.plan_trip()
        except Exception as e:
            logger.error(f"HOS scheduling error: {e}", exc_info=True)
            return Response(
                {"success": False, "error": f"HOS calculation error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # 4. Assemble response payload
        response_payload = {
            "success": True,
            "inputs": {
                "current_location": curr_loc,
                "pickup_location": pickup_loc,
                "dropoff_location": dropoff_loc,
                "cycle_used_hours": cycle_used,
            },
            "summary": plan_result["summary"],
            "compliance": plan_result["compliance"],
            "route": {
                "total_distance_miles": plan_result["summary"]["total_distance_miles"],
                "total_driving_time_hours": plan_result["summary"]["total_driving_time_hours"],
                "leg1": {
                    "from": curr_loc["name"],
                    "to": pickup_loc["name"],
                    "distance_miles": leg1_route["distance_miles"],
                    "duration_hours": leg1_route["duration_hours"],
                    "coordinates": leg1_route["coordinates"],
                },
                "leg2": {
                    "from": pickup_loc["name"],
                    "to": dropoff_loc["name"],
                    "distance_miles": leg2_route["distance_miles"],
                    "duration_hours": leg2_route["duration_hours"],
                    "coordinates": leg2_route["coordinates"],
                },
                "waypoints": [
                    {
                        "type": "origin",
                        "name": curr_loc["name"],
                        "lat": curr_loc["lat"],
                        "lng": curr_loc["lng"],
                    },
                    {
                        "type": "pickup",
                        "name": pickup_loc["name"],
                        "lat": pickup_loc["lat"],
                        "lng": pickup_loc["lng"],
                    },
                    {
                        "type": "dropoff",
                        "name": dropoff_loc["name"],
                        "lat": dropoff_loc["lat"],
                        "lng": dropoff_loc["lng"],
                    },
                ],
                "stops": plan_result["stops"],
            },
            "schedule": plan_result["schedule"],
            "daily_logs": plan_result["daily_logs"],
        }

        return Response(response_payload, status=status.HTTP_200_OK)
