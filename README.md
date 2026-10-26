# AI Mock Interview Platform

An AI-powered mock interview application designed to help candidates practice interviews, improve their answers, and evaluate their performance through personalized feedback.

## Overview

The AI Mock Interview Platform provides an interactive environment for interview preparation. Users can configure mock interviews, answer questions using text or voice, and review their performance through a feedback dashboard.

## Features

- **User Authentication:** Register and log in to access the application.
- **Customizable Interviews:** Configure the number of interview questions.
- **AI-Powered Interview Questions:** Generate interview questions using AI services.
- **Text-Based Answers:** Submit written answers during interviews.
- **Voice Interviews:** Record and submit spoken answers.
- **Performance Evaluation:** View interview scores and feedback.
- **Interview History:** Access previous interview sessions.
- **Resume Support:** Upload and manage resumes, where supported by the application.

## Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- HTML
- CSS

### Backend
- Node.js
- Express.js
- REST APIs

### Database
- MongoDB

### AI and Voice Services
- Google Gemini API
- AssemblyAI
- Murf AI

### Development Tools
- Git
- GitHub
- Visual Studio Code
- npm

## Project Structure

```text
AI-Mock-Interview-Platform/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the application:

- Node.js and npm
- MongoDB or a MongoDB Atlas database
- API credentials for the external AI and voice services used by the application

### 1. Clone the Repository

```bash
git clone https://github.com/Susmithadongari05/AI-Mock-Interview-Platform.git
cd AI-Mock-Interview-Platform
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

Configure the backend environment variables in a `.env` file using the variable names expected by the server code. Add your database connection string, authentication secrets, and required service API keys. Never commit this file to GitHub.

### 3. Start the Backend

Run the startup command configured in `server/package.json`. For example, if the project defines a `start` script:

```bash
npm start
```

### 4. Install Frontend Dependencies

Open a second terminal from the project root:

```bash
cd client
npm install
```

### 5. Start the Frontend

Run the startup command configured in `client/package.json`. For example, if the project defines a `dev` script:

```bash
npm run dev
```

Open the local address displayed in the terminal to access the application.

> **Note:** Exact environment variable names and startup scripts depend on the project's configuration.

## Security

- Keep API keys, database credentials, and JWT secrets private.
- Store sensitive configuration in environment variables.
- Do not commit `.env` files or credentials to version control.
- Validate and protect API requests appropriately.

## Future Improvements

- Deploy the frontend and backend for public access.
- Add more interview categories and difficulty levels.
- Improve personalized feedback and performance analytics
