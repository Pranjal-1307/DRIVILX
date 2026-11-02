from django.test import SimpleTestCase
from unittest.mock import patch

from apps.bookings.maps import _city_from_address, normalize_city, resolve_city, search_locations, validate_point
from apps.bookings.services import calculate_estimated_fare


class LocationAndFareTests(SimpleTestCase):
    def test_city_normalization_handles_aliases_case_and_whitespace(self):
        self.assertEqual(normalize_city("  BANGALORE  "), "bengaluru")
        self.assertEqual(normalize_city("New Delhi"), "new delhi")

    def test_invalid_coordinates_are_rejected(self):
        with self.assertRaises(ValueError):
            validate_point({"lat": 91, "lng": 72}, "pickup")

    def test_city_district_and_confirmed_city_fallback(self):
        self.assertEqual(normalize_city("Ahmedabad District"), "ahmedabad")
        self.assertEqual(_city_from_address({"city_district": "Ahmedabad"}), "Ahmedabad")
        self.assertEqual(_city_from_address({"city_district": "Asarva Taluka", "county": "Ahmedabad"}), "Ahmedabad")
        self.assertEqual(_city_from_address({"city_district": "Asarva Taluka"}), "")
        self.assertEqual(_city_from_address({"county": "Asarva Taluka", "state_district": "Ahmedabad"}), "Ahmedabad")
        self.assertEqual(resolve_city({"city": "", "address": "Shahibaug, Ahmedabad, Gujarat, India"}, "Ahmedabad"), "Ahmedabad")
        self.assertEqual(resolve_city({"city": "", "address": "Shahibaug, Gujarat, India"}, "Ahmedabad"), "")

    def test_driver_rate_is_used_with_existing_trip_charges(self):
        fare = calculate_estimated_fare("A", "B", "city_ride", "Sedan", 15.5, 30, 20)
        self.assertEqual(fare["distance_cost"], 310)
        self.assertEqual(fare["rate_per_km"], 20)
        self.assertEqual(fare["distance_km"], 15.5)
        self.assertGreater(fare["total_fare"], 310)

    def test_missing_route_distance_is_never_fabricated(self):
        with self.assertRaises(ValueError):
            calculate_estimated_fare("A", "B")

    @patch("apps.bookings.maps.search_locations", return_value=[{"city": "Ahmedabad"}])
    def test_legacy_taluka_driver_city_resolves_to_parent_city(self, search):
        from apps.bookings.maps import canonical_city_name
        self.assertEqual(canonical_city_name("Asarva Taluka"), "Ahmedabad")
        search.assert_called_once_with("Asarva Taluka, India")

    @patch("apps.bookings.maps._photon_search", return_value=[{"address": "Shilalekh, Shahibaug, Ahmedabad", "lat": 23.05, "lng": 72.59, "place_id": "photon:W:1", "city": "Ahmedabad"}])
    @patch("apps.bookings.maps._nominatim", return_value=[])
    def test_location_search_uses_photon_when_nominatim_has_no_result(self, nominatim, photon):
        results = search_locations("Shilalekh Shahibaug Ahemdabad")
        self.assertEqual(results[0]["city"], "Ahmedabad")
        photon.assert_called_once_with("Shilalekh Shahibaug Ahemdabad")
