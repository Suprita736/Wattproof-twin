
# Maps YOLO labels to WattProof Twin appliance types.
# Power values are illustrative estimates, not measured consumption.

YOLO_TO_APPLIANCE = {
    "tv": "television",
    "laptop": "laptop",
}

DEFAULT_POWER_WATTS = {
    "television": 100,
    "laptop": 65,
    "ceiling_fan": 75,
    "refrigerator": 150,
    "air_conditioner": 1500,
    "light": 12,
}

def map_detection(label: str):
    """Return a mapped appliance type, or None if unsupported."""
    return YOLO_TO_APPLIANCE.get(label.lower())

def get_appliance_options():
    """Return appliance types available for manual selection."""
    return list(DEFAULT_POWER_WATTS.keys())

def enrich_detection(detection: dict) -> dict:
    """Add an appliance suggestion and estimated power to a detection."""
    appliance_type = map_detection(detection["label"])

    return {
        **detection,
        "appliance_type": appliance_type,
        "suggested_power_watts": (
            DEFAULT_POWER_WATTS.get(appliance_type)
            if appliance_type else None
        ),
        "needs_confirmation": True,
    }
