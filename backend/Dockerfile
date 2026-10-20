# Backend: FastAPI (Python 3.12). Системные библиотеки не нужны:
# psycopg[binary] несёт libpq, pdfplumber/pdfminer/Pillow ставятся wheel-ами.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Приложение работает не от root: отдельный непривилегированный пользователь.
RUN useradd --create-home --uid 10001 appuser

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Проверка живости без curl — только стандартная библиотека Python.
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=12 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
