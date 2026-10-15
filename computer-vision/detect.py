
from pathlib import Path
from ultralytics import YOLO

# Project paths
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Load the model once when this module is imported
MODEL = YOLO("yolo11n.pt")


def detect_objects(image_path, confidence_threshold=0.25):
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

    # Run YOLO inference
    results = MODEL.predict(
        source=str(image_path),
        conf=confidence_threshold,
        verbose=False
    )

    result = results[0]
    detections = []

    # Extract each detected object's information
    if result.boxes is not None:
        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append({
                "label": result.names[class_id],
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2)
                }
            })

    # Save image with bounding boxes
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
