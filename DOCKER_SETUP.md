# Docker Setup Guide for PWA Restaurants

## Quick Start

### Using Docker Compose (Recommended)
```bash
# Build and start the container
docker-compose up -d

# Stop the container
docker-compose down

# View logs
docker-compose logs -f
```

### Using Docker CLI

**Build the image:**
```bash
docker build -t pwa-restaurants:latest .
```

**Run the container:**
```bash
docker run -d \
  --name pwa-restaurants \
  -p 3000:3000 \
  -v $(pwd)/database:/app/database \
  -v $(pwd)/frontend/icons:/app/frontend/icons \
  pwa-restaurants:latest
```

**On Windows (PowerShell):**
```powershell
docker run -d `
  --name pwa-restaurants `
  -p 3000:3000 `
  -v ${PWD}/database:/app/database `
  -v ${PWD}/frontend/icons:/app/frontend/icons `
  pwa-restaurants:latest
```

## Container Details

- **Base Image**: `node:20-alpine` (lightweight production image)
- **Port**: `3000` (configurable)
- **Entry Point**: Express.js server at `backend/server.js`
- **Volumes**: 
  - `database/` - Persists SQLite database
  - `frontend/icons/` - Persists uploaded icons

## Useful Commands

**View container logs:**
```bash
docker logs pwa-restaurants -f
```

**Stop the container:**
```bash
docker stop pwa-restaurants
```

**Remove the container:**
```bash
docker rm pwa-restaurants
```

**Rebuild the image:**
```bash
docker build --no-cache -t pwa-restaurants:latest .
```

## Environment Configuration

Before running, you can:
1. Initialize the database by running `node backend/init_db.js` locally before building
2. Or modify the startup script in `backend/server.js` to auto-initialize on first run

## Troubleshooting

- **Port 3000 already in use**: Map to a different port: `-p 8080:3000`
- **Database not persisting**: Ensure volume is properly mounted
- **Permission issues on volumes**: Run with proper user permissions or adjust ownership
