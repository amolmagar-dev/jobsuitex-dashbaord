├── README.md
├── cache/
├── config/
│   ├── config.js
│   └── server.config.js  <-- New server configuration
├── frontend/             <-- New directory for client-side code
│   ├── public/
│   │   ├── index.html
│   │   ├── css/
│   │   └── js/
│   └── src/              <-- If using a framework like React
│       └── components/
├── logs/
├── nodemon.json
├── notifier/
├── package.json
├── src/
│   ├── ai/
│   ├── browser/
│   │   ├── browser.js
│   │   └── BrowserStreamer.js  <-- New class for handling streaming
│   ├── scraper/
│   ├── server/           <-- New server directory
│   │   ├── index.js      <-- Main server entry point
│   │   ├── routes/       <-- API routes
│   │   ├── middleware/   <-- Server middleware
│   │   └── sockets/      <-- Socket.io handlers
│   └── utils/
└── tests/

User Configuration → Job Scheduler → Job Queue → Worker Manager → 
Available Worker Container → Process Job → Store Results → Notify User