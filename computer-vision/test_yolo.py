
from ultralytics import YOLO
from pathlib import Path

# Load a small pretrained YOLO model
model = YOLO("yolo11n.pt")

# Image path
image_path = Path("sample_images/test_room.jpg")

if not image_path.exists():
    print(f"Image not found: {image_path}")
    print("Please add test_room.jpg inside sample_images/")
else:
    # Detect objects in the image
    results = model.predict(
        source=str(image_path),
        conf=0.25,
        save=True
    )

    # Print the detected objects
    for result in results:
        print("\nDetected objects:")

        if result.boxes is None or len(result.boxes) == 0:
            print("No objects detected.")
            continue

        for box in result.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            object_name = result.names[class_id]

            print(
                f"- {object_name}: "
                f"{confidence * 100:.1f}% confidence"
            )

    print("\nDetection finished!")
    print("Check the runs/detect/ folder for the output image.")
