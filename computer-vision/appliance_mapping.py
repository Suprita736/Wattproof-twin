import re

# Maps detector labels to WattProof Twin appliance types.
# Power values are illustrative estimates, not measured consumption.

YOLO_TO_APPLIANCE = {
    # Standard labels
    "tv": "television",
    "television": "television",
    "laptop": "laptop",
    "refrigerator": "refrigerator",
    "microwave": "microwave",
    "microwave oven": "microwave",
    # Labels from the open-vocabulary class list in detect.py
    "ceiling fan": "ceiling_fan",
    "ceiling light": "light",
    "led panel light": "light",
    "ceiling light panel": "light",
    "tube light": "light",
    "air conditioner": "air_conditioner",
    "projector": "projector",
}

DEFAULT_POWER_WATTS = {
    "television": 100,
    "laptop": 65,
    "ceiling_fan": 75,
    "refrigerator": 150,
    "air_conditioner": 1500,
    "light": 12,
    "microwave": 1100,
    "projector": 250,
}

# Fallback for label variants that are not listed above (matched word by word).
TOKEN_RULES = {
    "fan": "ceiling_fan",
    "conditioner": "air_conditioner",
    "ac": "air_conditioner",
    "projector": "projector",
    "television": "television",
    "tv": "television",
    "microwave": "microwave",
    "refrigerator": "refrigerator",
    "fridge": "refrigerator",
    "laptop": "laptop",
    "light": "light",
    "lamp": "light",
    "tubelight": "light",
}


def map_detection(label: str):
    """Return a mapped appliance type, or None if unsupported."""
    label = label.strip().lower()

    if label in YOLO_TO_APPLIANCE:
        return YOLO_TO_APPLIANCE[label]

    words = re.findall(r"[a-z]+", label)
    if "traffic" in words:  # "traffic light" is not building equipment
        return None

    for word in words:
        if word in TOKEN_RULES:
            return TOKEN_RULES[word]

    return None


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


def _overlap(a: dict, b: dict):
    """Return (IoU, intersection-over-smaller-box) for two bounding boxes."""
    inter_w = max(0, min(a["x2"], b["x2"]) - max(a["x1"], b["x1"]))
    inter_h = max(0, min(a["y2"], b["y2"]) - max(a["y1"], b["y1"]))
    inter = inter_w * inter_h

    area_a = max(0, a["x2"] - a["x1"]) * max(0, a["y2"] - a["y1"])
    area_b = max(0, b["x2"] - b["x1"]) * max(0, b["y2"] - b["y1"])

    union = area_a + area_b - inter
    smaller = min(area_a, area_b)

    iou = inter / union if union else 0
    ios = inter / smaller if smaller else 0
    return iou, ios


def group_detections(items: list[dict]) -> list[dict]:
    """One entry per appliance type, with a count of distinct objects.

    Boxes of the same type that overlap heavily are treated as the same
    object, and the strongest detection is kept.
    """
    ordered = sorted(items, key=lambda d: d["confidence"], reverse=True)
    groups = {}
    kept_boxes = {}

    for d in ordered:
        key = d.get("appliance_type") or d["label"]
        boxes = kept_boxes.setdefault(key, [])

        is_duplicate = any(
            iou > 0.3 or ios > 0.6
            for iou, ios in (_overlap(d["bbox"], other) for other in boxes)
        )
        if is_duplicate:
            continue

        boxes.append(d["bbox"])
        group = groups.setdefault(key, {**d, "count": 0})
        group["count"] += 1

    return list(groups.values())