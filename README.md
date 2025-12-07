# PWA Restaurants

## Overview
PWA Restaurants is a Progressive Web App (PWA) designed for food enthusiasts to discover, rate, and review restaurants. The app provides a seamless user experience with offline capabilities, responsive design, and a modern interface.

## Features
- **Restaurant Discovery**: Search and explore restaurants with ease.
- **User Ratings & Reviews**: View and submit ratings and reviews for restaurants.
- **Top Rated Restaurants**: Highlight the top-rated restaurants.
- **Admin Panel**: Manage restaurant data and reviews.

## Project Structure
```
PWA Restaurants/
├── backend/                # Backend server files
│   ├── init_db.js         # Database initialization script
│   ├── server.js          # Express server
├── database/               # Database files
├── frontend/               # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   ├── app.js             # Main JavaScript file
│   ├── manifest.json      # PWA manifest
│   ├── service-worker.js  # Service worker for offline support
│   ├── icons/             # App icons
├── package.json            # Node.js dependencies
├── README.md               # Project documentation
```

## Installation
1. Navigate to the project directory:
   ```bash
   cd PWARestaurants
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage
1. Initialise the database:
   ```bash
   node backend/init_db.js
   ```
2. Start the backend server:
   ```bash
   node backend/server.js
   ```
3. Open the app in your browser:
   ```
   http://localhost:3000
   ```

## Technologies Used
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite
- **PWA Features**: Service Worker, Manifest

## Contributing
Contributions are welcome! Feel free to submit issues or pull requests to improve the project.

## Acknowledgments
- Built with ❤️ for food enthusiasts.