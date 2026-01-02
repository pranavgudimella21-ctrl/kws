from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import os
import uuid

router = APIRouter()

@router.post("/ocr/upload")
async def ocr_upload(file: UploadFile = File(...)):
    try:
        from config import get_ocr_config
        ocr_config = get_ocr_config()

        if file.size > ocr_config["MAX_FILE_SIZE"]:
            raise HTTPException(status_code=400, detail="File too large")

        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in ocr_config["ALLOWED_EXTENSIONS"]:
            raise HTTPException(status_code=400, detail="File type not allowed")

        upload_folder = Path(ocr_config["UPLOAD_FOLDER"])
        os.makedirs(upload_folder, exist_ok=True)

        file_id = str(uuid.uuid4())
        file_path = upload_folder / f"{file_id}.{file_extension}"

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        return {
            "file_id": file_id,
            "filename": file.filename,
            "status": "uploaded"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
