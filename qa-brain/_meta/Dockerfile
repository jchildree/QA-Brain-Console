FROM python:3.12-slim
RUN pip install --no-cache-dir python-pptx
WORKDIR /vault
ENTRYPOINT ["python", "qa-brain/_meta/ingest_notes.py"]
