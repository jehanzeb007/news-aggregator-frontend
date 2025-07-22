# 📦 Docker Setup for Frontend

This guide explains how to build and run the frontend of the application using Docker.

---

## 🛠️ Step 1: Build the Docker Image

Open your terminal in the project root directory and run:

```bash
docker build -t my-vite-app .
```

This will build a Docker image named `my-vite-app` using the Dockerfile provided in the root directory.

---

## ▶️ Step 2: Run the Docker Container

Once the image is built, run the container using:

```bash
docker run -p 8080:80 my-vite-app
```

This maps port 8080 on your local machine to port 80 inside the container.

Your frontend app will now be accessible at:  
[http://localhost:8080](http://localhost:8080)

---

## ✅ Notes

- Ensure Docker is installed and running on your machine before executing these commands.
- You may change the port (`8080`) if it is already in use on