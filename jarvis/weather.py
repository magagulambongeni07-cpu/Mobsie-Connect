"""Weather from Open-Meteo (free, no API key). Location from config or your IP."""
import json
import urllib.parse
import urllib.request

UA = {"User-Agent": "jarvis-voice-assistant/1.0"}

CODES = {
    0: "clear skies", 1: "mostly clear skies", 2: "partly cloudy skies", 3: "overcast skies",
    45: "fog", 48: "freezing fog", 51: "light drizzle", 53: "drizzle", 55: "heavy drizzle",
    56: "freezing drizzle", 57: "freezing drizzle", 61: "light rain", 63: "rain",
    65: "heavy rain", 66: "freezing rain", 67: "freezing rain", 71: "light snow",
    73: "snow", 75: "heavy snow", 77: "snow grains", 80: "light showers", 81: "showers",
    82: "heavy showers", 85: "snow showers", 86: "heavy snow showers",
    95: "thunderstorms", 96: "thunderstorms with hail", 99: "thunderstorms with hail",
}


def _get(url, timeout=6):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def locate(city=""):
    """Return (lat, lon, place_name)."""
    if city:
        q = urllib.parse.urlencode({"name": city, "count": 1})
        res = _get("https://geocoding-api.open-meteo.com/v1/search?" + q).get("results") or []
        if res:
            r = res[0]
            return r["latitude"], r["longitude"], r["name"]
    d = _get("https://ipapi.co/json/")
    return d["latitude"], d["longitude"], d.get("city", "")


def fetch(lat, lon, units="celsius"):
    q = urllib.parse.urlencode({
        "latitude": lat, "longitude": lon,
        "current": "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "temperature_unit": "fahrenheit" if units == "fahrenheit" else "celsius",
        "timezone": "auto", "forecast_days": 1,
    })
    return _get("https://api.open-meteo.com/v1/forecast?" + q)


def describe(data, place=""):
    """Turn an Open-Meteo response into one or two spoken sentences."""
    cur, day = data["current"], data["daily"]
    sky = CODES.get(int(cur["weather_code"]), "mixed conditions")
    t = round(cur["temperature_2m"])
    hi, lo = round(day["temperature_2m_max"][0]), round(day["temperature_2m_min"][0])
    rain = (day.get("precipitation_probability_max") or [None])[0]
    where = " in %s" % place if place else ""
    s = "It's currently %d degrees%s with %s. Today's high is %d, low of %d." % (t, where, sky, hi, lo)
    if rain is not None and rain >= 40:
        s += " There's a %d percent chance of rain, so you may want an umbrella." % rain
    return s


def report(cfg):
    try:
        lat, lon, place = locate(cfg.get("city", ""))
        return describe(fetch(lat, lon, cfg.get("units", "celsius")), place)
    except Exception:
        return "I'm afraid I couldn't reach the weather service just now."
