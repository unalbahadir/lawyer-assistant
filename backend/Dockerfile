FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create necessary directories and database file
RUN mkdir -p uploads vector_db && \
    touch avukat.db && \
    chmod 666 avukat.db

EXPOSE 8000

# Create startup script
RUN echo '#!/bin/sh\n\
touch /app/avukat.db\n\
chmod 666 /app/avukat.db\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
