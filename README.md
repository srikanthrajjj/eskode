# Eskode3 - Police and Victim Communication App

A secure communication platform for police officers and victims, built with React, TypeScript, and Vite.

## Deployment Information

### Frontend
- Deployed on Netlify
- URL: [https://eskode3.netlify.app](https://eskode3.netlify.app)

### Backend (MCP Server)
- Deployed on Render.com
- URL: [https://eskode3-mcp-server.onrender.com](https://eskode3-mcp-server.onrender.com)
- Available endpoints:
  - `/` - Server status
  - `/api/status` - Detailed server status and connections
  - `/api/clients` - List of connected clients

## Features
- Real-time messaging between police officers and victims
- Case management system
- Appointment scheduling
- Document sharing
- Multi-language support
- Responsive design for mobile and desktop

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

# Police Case Management

A modern case management system for police officers and administrators.

## Features

- Real-time messaging between admin and police officers
- Case management
- Document handling
- Appointment scheduling
- Victim communication

## Real-time Communication

The application uses Socket.io for real-time communication between admin and police interfaces. The WebSocket server handles:

- Real-time messages between admin and officers
- Typing indicators
- Read receipts
- User connection status

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Running the application

To run both the web application and WebSocket server simultaneously:

```
npm start
```

Alternatively, you can run them separately:

- Web application: `npm run dev`
- WebSocket server: `npm run websocket`

### Accessing the application

- Web application: http://localhost:5173 (or another port if this one is in use)
- WebSocket server: http://localhost:3001

## Development

The project uses:

- React
- TypeScript
- Tailwind CSS
- Socket.io for real-time communication
