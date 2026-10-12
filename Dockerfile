FROM python:3.12-slim
WORKDIR /site
COPY index.html ./
COPY src ./src
COPY assets ./assets
USER 10001:10001
EXPOSE 8000
CMD ["python", "-m", "http.server", "8000", "--bind", "0.0.0.0"]
