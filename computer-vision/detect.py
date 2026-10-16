from pathlib import Path
from ultralytics import YOLO, YOLOWorld

# Project paths
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Things we want to find (open-vocabulary models match photos to these words).
CLASSES = [
    "ceiling fan",
    "ceiling light",
    "LED panel light",
    "tube light",
    "projector",
    "air conditioner",
    "television",
    "laptop",
    "refrigerator",
    "microwave oven",
]

# Lights are small and low-contrast, so accept weaker matches for them.
CLASS_CONFIDENCE = {
    "ceiling light": 0.05,
    "led panel light": 0.05,
    "tube light": 0.05,
}


def _load_model():
    """Try the best available detector; never crash the server."""
    # 1) YOLO-World (needs the CLIP text model download)
    try:
        model = YOLOWorld("yolov8s-worldv2.pt")
        model.set_classes(CLASSES)
        print("[detect] Loaded YOLO-World")
        return model
    except Exception as exc:
        print(f"[detect] YOLO-World unavailable: {exc}")

    # 2) YOLOE (text encoder downloads from GitHub instead)
    try:
        from ultralytics import YOLOE
        model = YOLOE("yoloe-11s-seg.pt")
        model.set_classes(CLASSES, model.get_text_pe(CLASSES))
        print("[detect] Loaded YOLOE")
        return model
    except Exception as exc:
        print(f"[detect] YOLOE unavailable: {exc}")

    # 3) Basic model: cannot see fans/lights/projectors, but the app still works
    print("[detect] Falling back to yolo11n (basic objects only)")
    return YOLO("yolo11n.pt")


# Load once when this module is imported
MODEL = _load_model()


def detect_objects(image_path, confidence_threshold=0.15):
    """
    Detect objects in an image.

    Returns:
        A dictionary containing detections and the
        path to the annotated image.
    """
    image_path = Path(image_path).expanduser().resolve()

    if not image_path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    if not image_path.is_file():
        raise ValueError("The supplied path is not a file.")

    # Run inference at the lowest threshold we might accept,
    # then apply per-class thresholds below.
    lowest = min([confidence_threshold, *CLASS_CONFIDENCE.values()])

    results = MODEL.predict(
        source=str(image_path),
        conf=lowest,
        imgsz=1280,            # higher resolution helps small ceiling lights
        agnostic_nms=True,     # same object under two names counts once
        verbose=False
    )

    result = results[0]
    detections = []

    # Extract each detected object's information
    if result.boxes is not None:
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            label = result.names[class_id]

            required = CLASS_CONFIDENCE.get(
                label.lower(), confidence_threshold
            )
            if confidence < required:
                continue

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "label": label,
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2)
                }
            })

    # Save image with bounding boxes (shows all candidates, handy for debugging)
    output_path = OUTPUT_DIR / f"{image_path.stem}_detected.jpg"
    result.save(filename=str(output_path))

    return {
        "image_name": image_path.name,
        "detection_count": len(detections),
        "detections": detections,
        "annotated_image": str(output_path)
    }


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) < 2:
        print(
            "Usage: python detect.py "
            "sample_images/test_room.jpg"
        )
        sys.exit(1)

    try:
        output = detect_objects(sys.argv[1])
        print(json.dumps(output, indent=2))
    except (FileNotFoundError, ValueError) as error:
        print(f"Input error: {error}")
        sys.exit(1)