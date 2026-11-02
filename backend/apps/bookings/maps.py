"""Provider adapters for Nominatim geocoding and OSRM routing."""
import json
import os
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class MapServiceError(Exception):
    pass


_nominatim_lock = threading.Lock()
_nominatim_last = 0.0
_nominatim_cache = {}
_photon_cache = {}


def validate_point(value, label="location"):
    if not isinstance(value, dict):
        raise ValueError(f"Select a valid {label} with coordinates.")
    try:
        lat, lng = float(value.get("lat")), float(value.get("lng"))
    except (TypeError, ValueError):
        raise ValueError(f"Select a valid {label} with coordinates.")
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise ValueError(f"The {label} coordinates are invalid.")
    return {"lat": lat, "lng": lng}


def _json_request(url, headers=None, timeout=15):
    request = Request(url, headers={"Accept": "application/json", **(headers or {})})
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        raise MapServiceError("The location service is unavailable right now. Please try again.") from exc


def _nominatim(params):
    global _nominatim_last
    cache_key = urlencode(sorted(params.items()))
    cached = _nominatim_cache.get(cache_key)
    if cached and cached[0] > time.time() and cached[1]:
        return cached[1]
    base = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org").rstrip("/")
    endpoint = params.pop("_endpoint")
    with _nominatim_lock:
        cached = _nominatim_cache.get(cache_key)
        if cached and cached[0] > time.time() and cached[1]:
            return cached[1]
        delay = 1.05 - (time.monotonic() - _nominatim_last)
        if delay > 0:
            time.sleep(delay)
        contact = os.getenv("DRIVILX_CONTACT_EMAIL", "support@drivilx.com")
        _nominatim_last = time.monotonic()
        data = _json_request(f"{base}/{endpoint}?{urlencode(params)}", headers={"User-Agent": f"DRIVILX/1.0 (India booking location service; contact: {contact})"})
        # Never cache empty search/reverse responses: OSM data and provider
        # availability can change, and a no-hit must be retried immediately.
        if data:
            _nominatim_cache[cache_key] = (time.time() + 900, data)
        return data


def _city_from_address(address):
    address = address if isinstance(address, dict) else {}
    city = address.get("city") or address.get("town") or address.get("municipality")
    if city and str(city).casefold().endswith((" taluka", " tehsil", " subdistrict")):
        city = None
    if city:
        return city
    # In Indian Nominatim results, city_district may actually be a taluka or
    # tehsil (for example, "Asarva Taluka"). Prefer district/county names.
    for key in ("county", "state_district", "borough", "city_district", "village", "hamlet"):
        candidate = str(address.get(key) or "").strip()
        if not candidate:
            continue
        if candidate.casefold().endswith((" taluka", " tehsil", " subdistrict")):
            continue
        return candidate
    return ""


def _place(row):
    address = row.get("address") or {}
    city = _city_from_address(address)
    return {"address": row.get("display_name", ""), "lat": float(row["lat"]), "lng": float(row["lon"]), "place_id": str(row.get("place_id", "")), "osm_type": row.get("osm_type"), "osm_id": row.get("osm_id"), "city": city, "city_normalized": normalize_city(city), "country_code": address.get("country_code", "")}


def normalize_city(value):
    import re
    import unicodedata
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKC", str(value)).casefold().strip()
    normalized = re.sub(r"[^\w\s]", " ", normalized)
    normalized = " ".join(normalized.split())
    normalized = re.sub(r"\s+(district|taluka|tehsil|subdistrict)$", "", normalized)
    aliases = {"bangalore": "bengaluru", "bombay": "mumbai", "madras": "chennai", "calcutta": "kolkata", "baroda": "vadodara", "gurgaon": "gurugram"}
    return aliases.get(normalized, normalized)


def resolve_city(place, selected_city=""):
    """Use a selected Nominatim city only when the reverse result names it too."""
    city = (place or {}).get("city")
    if city:
        return city
    candidate = str(selected_city or "").strip()
    if not candidate:
        return ""
    components = [normalize_city(part) for part in str((place or {}).get("address", "")).split(",")]
    return candidate if normalize_city(candidate) in components else ""


def canonical_city_name(value):
    """Resolve a saved Indian taluka/tehsil label to its containing city."""
    raw = str(value or "").strip()
    if not raw:
        return ""
    if not raw.casefold().endswith((" taluka", " tehsil", " subdistrict")):
        return raw
    results = search_locations(f"{raw}, India")
    for result in results:
        city = result.get("city")
        if city and normalize_city(city) != normalize_city(raw):
            return city
    return raw


def _query_fallbacks(query):
    """Build progressively shorter place queries for detailed/partial addresses."""
    parts = [part.strip() for part in str(query or "").split(",") if part.strip()]
    variants = []
    if len(parts) > 2:
        # Keep the landmark and nearby locality; long road and administrative
        # suffixes often make public geocoders return no matches.
        for count in (3, 2):
            candidate = ", ".join(parts[:count])
            if len(candidate) >= 3:
                variants.append(candidate)
    words = str(query or "").replace(",", " ").split()
    if len(words) > 4:
        variants.append(" ".join(words[:4]))
    original = str(query or "").strip().casefold()
    return list(dict.fromkeys(v for v in variants if v.casefold() != original))


def search_locations(query):
    query = str(query or "").strip()
    if len(query) < 3:
        return []
    nominatim_places = []
    nominatim_error = None
    try:
        data = _nominatim({"_endpoint": "search", "q": query, "countrycodes": "in", "format": "jsonv2", "addressdetails": "1", "limit": "6", "accept-language": "en"})
        nominatim_places = [_place(row) for row in data if row.get("lat") and row.get("lon")]
    except MapServiceError as exc:
        nominatim_error = exc
    try:
        # Photon adds typo tolerance for local society names. This endpoint is
        # called only on an explicit Search action, never on each keystroke.
        photon_places = _photon_search(query)
    except MapServiceError:
        photon_places = []
    # Retry shorter landmark/locality forms when exact detailed queries have no
    # mapped hits. Photon is tried first to avoid additional Nominatim traffic.
    if not nominatim_places and not photon_places:
        for fallback in _query_fallbacks(query):
            try:
                photon_places = _photon_search(fallback)
            except MapServiceError:
                pass
            if photon_places:
                break
            try:
                data = _nominatim({"_endpoint": "search", "q": fallback, "countrycodes": "in", "format": "jsonv2", "addressdetails": "1", "limit": "6", "accept-language": "en"})
                nominatim_places = [_place(row) for row in data if row.get("lat") and row.get("lon")]
            except MapServiceError as exc:
                nominatim_error = exc
            if nominatim_places:
                break
    if not nominatim_places and not photon_places and nominatim_error:
        raise nominatim_error
    results = []
    seen = set()
    for place in nominatim_places + photon_places:
        key = (str(place.get("osm_type", "")), str(place.get("osm_id", "")))
        if key != ("", "") and key in seen:
            continue
        if key != ("", ""):
            seen.add(key)
        results.append(place)
    return results[:10]


def _photon_search(query):
    cache_key = str(query or "").strip().casefold()
    cached = _photon_cache.get(cache_key)
    if cached and cached[0] > time.time() and cached[1]:
        return cached[1]
    base = os.getenv("PHOTON_BASE_URL", "https://photon.komoot.io").rstrip("/")
    params = urlencode({"q": query, "countrycode": "IN", "limit": "8", "lang": "en"})
    contact = os.getenv("DRIVILX_CONTACT_EMAIL", "support@drivilx.com")
    data = _json_request(f"{base}/api/?{params}", headers={"User-Agent": f"DRIVILX/1.0 (India location search; contact: {contact})"})
    places = []
    for feature in data.get("features", []):
        props = feature.get("properties") or {}
        coordinates = (feature.get("geometry") or {}).get("coordinates") or []
        if len(coordinates) != 2 or str(props.get("countrycode", "")).upper() != "IN":
            continue
        name = props.get("name", "")
        components = [name]
        for field in ("housenumber", "street", "district", "city", "county", "state", "postcode", "country"):
            value = props.get(field)
            if value and value not in components:
                components.append(value)
        display_name = ", ".join(components)
        city = props.get("city") or props.get("county") or props.get("state_district") or props.get("district")
        osm_type = props.get("osm_type", "")
        osm_id = props.get("osm_id", "")
        places.append({
            "address": display_name,
            "lat": float(coordinates[1]),
            "lng": float(coordinates[0]),
            "place_id": f"photon:{osm_type}:{osm_id}",
            "osm_type": osm_type,
            "osm_id": osm_id,
            "city": city,
            "city_normalized": normalize_city(city),
            "country_code": "in",
            "provider": "photon",
        })
    if places:
        _photon_cache[cache_key] = (time.time() + 900, places)
    return places


def reverse_location(point):
    point = validate_point(point)
    row = _nominatim({"_endpoint": "reverse", "lat": str(point["lat"]), "lon": str(point["lng"]), "format": "jsonv2", "zoom": "18", "addressdetails": "1", "accept-language": "en"})
    place = _place(row)
    if place.get("country_code", "").lower() != "in":
        raise ValueError("Choose a pickup and destination within India.")
    return {**place, "lat": point["lat"], "lng": point["lng"]}


def calculate_route(origin, destination):
    origin = validate_point(origin, "pickup")
    destination = validate_point(destination, "destination")
    base = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org").rstrip("/")
    profile = os.getenv("OSRM_ROUTE_PROFILE", "driving").strip().lower()
    if profile not in {"driving", "cycling", "walking"}:
        raise MapServiceError("The configured route profile is invalid.")
    # OSRM expects longitude,latitude (not latitude,longitude).
    coords = f"{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
    url = f"{base}/route/v1/{profile}/{coords}?overview=full&geometries=geojson&steps=false"
    data = _json_request(url, headers={"User-Agent": "DRIVILX/1.0 (routing service)"})
    routes = data.get("routes") or []
    if data.get("code") != "Ok" or not routes:
        raise MapServiceError("No road route is available between these locations.")
    route = routes[0]
    geometry = route.get("geometry")
    if not isinstance(geometry, dict) or not geometry.get("coordinates"):
        raise MapServiceError("The routing service returned no route geometry.")
    return {"distance_km": round(float(route["distance"]) / 1000, 2), "duration_mins": max(1, round(float(route["duration"]) / 60)), "route_geometry": geometry, "route_summary": "Road route via OpenStreetMap"}
