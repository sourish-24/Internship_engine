# app.py
import os
import tempfile
import traceback
from functools import lru_cache

from flask import Flask, request, jsonify
import joblib
import torch
import torch.nn.functional as F
import numpy as np

from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification

# ---------- Config ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.environ.get("MODEL_DIR", os.path.join(BASE_DIR, "resume_bert_finetuned"))
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MAX_INPUT_LENGTH = int(os.environ.get("MAX_INPUT_LENGTH", 256))
TOP_K = int(os.environ.get("TOP_K", 3))
PORT = int(os.environ.get("PORT", 5000))
# ----------------------------

app = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

# ---------- Helpers ----------
def clean_text(text):
    import re
    if not isinstance(text, str):
        text = str(text)
        
    text = text.replace("\n", " ").replace("\r", " ")
    text = re.sub(r'[^A-Za-z0-9.,;:()/%\- ]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip().lower()


def extract_text_from_pdf_stream(file_stream):
    """Save to temp file and extract text using pdfplumber or pymupdf."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_stream.read())
        tmp_path = tmp.name
    try:
        text_parts = []
        try:
            import pdfplumber
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
        except Exception:
            try:
                import fitz
                doc = fitz.open(tmp_path)
                for page in doc:
                    page_text = page.get_text()
                    if page_text:
                        text_parts.append(page_text)
            except Exception as e:
                print("PDF extraction error:", e)
        return "\n".join(text_parts)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

# ---------- Model loading (cached) ----------
@lru_cache(maxsize=1)
def load_model_bundle(model_dir: str = None):
    """Load model, tokenizer and label encoder. Cached for speed."""
    if model_dir is None:
        model_dir = MODEL_DIR
    if not os.path.isdir(model_dir):
        # Fallback to checking relative to current directory or BASE_DIR
        alt = os.path.join(BASE_DIR, "resume_bert_finetuned")
        if os.path.isdir(alt):
            model_dir = alt
        else:
            raise FileNotFoundError(f"Model directory not found: {model_dir}")
    tokenizer = DistilBertTokenizerFast.from_pretrained(model_dir)
    model = DistilBertForSequenceClassification.from_pretrained(model_dir)
    model.to(DEVICE)
    model.eval()

    le_path = os.path.join(model_dir, "label_encoder.joblib")
    if not os.path.exists(le_path):
        possible = [p for p in os.listdir(model_dir) if p.endswith(".joblib")]
        if possible:
            le_path = os.path.join(model_dir, possible[0])
        else:
            raise FileNotFoundError("label_encoder.joblib not found in model dir")
    label_encoder = joblib.load(le_path)
    return {"tokenizer": tokenizer, "model": model, "label_encoder": label_encoder}

def predict_text(text: str, top_k: int = TOP_K):
    """Run inference and return top_k predicted labels + probabilities."""
    bundle = load_model_bundle()
    tokenizer = bundle["tokenizer"]
    model = bundle["model"]
    label_encoder = bundle["label_encoder"]

    cleaned = clean_text(text)
    inputs = tokenizer(
        cleaned,
        return_tensors="pt",
        truncation=True,
        padding="max_length",
        max_length=MAX_INPUT_LENGTH
    )
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = F.softmax(logits, dim=-1).cpu().numpy()[0]

    top_idx = np.argsort(probs)[::-1][:top_k]
    labels = label_encoder.inverse_transform(top_idx)
    results = []
    for i, idx in enumerate(top_idx):
        results.append({
            "rank": i + 1,
            "label": str(labels[i]),
            "index": int(idx),
            "score": float(probs[idx])
        })
    return results

# -------------------- Routes --------------------
@app.route("/health", methods=["GET"])
def health():
    try:
        _ = load_model_bundle()
        return jsonify({
            "status": "ok",
            "model": "DistilBERT Sequence Classifier",
            "device": DEVICE,
            "classes_count": len(_["label_encoder"].classes_)
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/predict", methods=["POST", "OPTIONS"])
def predict_route():
    if request.method == "OPTIONS":
        return "", 200

    try:
        top_k = int(request.args.get("top_k", TOP_K))
    except Exception:
        top_k = TOP_K

    # 1) JSON text input
    if request.is_json:
        payload = request.get_json()
        text = payload.get("text") if isinstance(payload, dict) else None
        if not text:
            return jsonify({"error": "No 'text' field in JSON payload"}), 400
        results = predict_text(text, top_k=top_k)
        return jsonify({
            "predictions": results,
            "input_length": len(text),
            "top_category": results[0]["label"] if results else None
        }), 200

    # 2) multipart form file
    if "file" in request.files:
        f = request.files["file"]
        fname = f.filename.lower()
        if fname.endswith(".pdf"):
            text = extract_text_from_pdf_stream(f.stream)
            if (not text) or text.strip() == "":
                return jsonify({"error": "No text could be extracted from PDF"}), 400
            results = predict_text(text, top_k=top_k)
            return jsonify({
                "predictions": results,
                "input_length": len(text),
                "extracted_text_preview": text[:300],
                "top_category": results[0]["label"] if results else None
            }), 200
        elif fname.endswith(".txt"):
            raw = f.read()
            try:
                text = raw.decode("utf-8", errors="ignore")
            except Exception:
                text = str(raw)
            results = predict_text(text, top_k=top_k)
            return jsonify({
                "predictions": results,
                "input_length": len(text),
                "top_category": results[0]["label"] if results else None
            }), 200
        else:
            return jsonify({"error": "Unsupported file type. Use PDF or .txt"}), 400

    # 3) form field text
    if "text" in request.form:
        text = request.form.get("text")
        results = predict_text(text, top_k=top_k)
        return jsonify({
            "predictions": results,
            "input_length": len(text),
            "top_category": results[0]["label"] if results else None
        }), 200

    return jsonify({"error": "No input found. Send JSON {'text':...} or multipart file."}), 400

@app.errorhandler(Exception)
def handle_exception(e):
    tb = traceback.format_exc()
    print(tb)
    return jsonify({"error": str(e), "traceback": tb}), 500

# -------------------- Run --------------------
if __name__ == "__main__":
    try:
        print("Preloading model bundle...")
        load_model_bundle()
        print("DistilBERT model loaded. Running on device:", DEVICE)
    except Exception as e:
        print("Failed to preload model at startup:", e)
    app.run(host="0.0.0.0", port=PORT, debug=False)
