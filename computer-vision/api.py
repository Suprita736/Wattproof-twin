
from pathlib import Path
from io import BytesIO
from tempfile import NamedTemporaryFile
from appliance_mapping import enrich_detection
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from equipment import router as equipment_router
from PIL import Image, UnidentifiedImageError
from energy import router as energy_router
from detect import detect_objects

app = FastAPI(
    title="WattProof Twin Computer Vision API",
    description="Detect visible objects in uploaded images.",
    version="1.0.0",
)
app.include_router(equipment_router)
app.include_router(energy_router)
# Local frontend development origins.
# The main backend owner should align this configuration during integration.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}


@app.get("/")
def home():
    return {
        "message": "WattProof Twin Computer Vision API is running",
        "endpoint": "/api/detect",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "computer-vision"}


@app.post("/api/detect")
async def detect_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Upload a JPEG, PNG, or WebP image.",
        )

    contents = await file.read(MAX_FILE_SIZE + 1)

    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image exceeds the 5 MB upload limit.",
        )

    temp_path = None

    try:
        # Validate that the upload contains a decodable image.
        with Image.open(BytesIO(contents)) as image:
            image.verify()

        suffix = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }[file.content_type]

        with NamedTemporaryFile(
            suffix=suffix,
            delete=False,
            dir=Path(__file__).parent / "outputs",
        ) as temp_file:
            temp_file.write(contents)
            temp_path = Path(temp_file.name)

        # Run the reusable YOLO detection module.
        result = detect_objects(temp_path)

        # Do not expose internal filesystem paths to the client.
        detections = [
    enrich_detection(item)
    for item in result["detections"]
]

        return {
            "image_name": file.filename or "uploaded_image",
            "detection_count": len(detections),
            "detections": detections,
            "message": (
                "Review and confirm the detected objects before "
                "adding equipment to the energy model."
                if detections
                else "No objects detected. Try another image or enter equipment manually."
            ),
            "data_source": "image_detection",
        }

    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file could not be decoded as an image.",
        ) from exc

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="The detection model could not access the image.",
        ) from exc

    finally:
        await file.close()

        if temp_path is not None:
            temp_path.unlink(missing_ok=True)
