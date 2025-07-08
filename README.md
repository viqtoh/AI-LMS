# Full Stack App: React + Express

This project is a full-stack web application with:

- A **React** frontend located in the `frontend/` directory
- An **Express.js** backend located in the `api/` directory

---

## 🗂️ Project Structure

```
root/
├── frontend/      # React application
├── api/           # Express backend API
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone [GIT REPO URL]
cd AI-LMS
```

---

### 2. Install Dependencies

#### Frontend

```bash
cd frontend
npm install
# or
yarn install
```

#### Backend

```bash
cd ../api
npm install
# or
yarn install
```

---

### 3. Add Environment Files

#### Frontend `.env`

Create a `.env` file inside the `frontend/` folder with the following content:

```
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_IMAGE_HOST=http://localhost:5000
```

#### Backend `.env`

Create a `.env` file inside the `api/` folder with the following structure:

```
DB_USER=[DB USER]
DB_HOST=[DB HOST]
DB_NAME=[DB NAME]
DB_PASSWORD=[DB PASSWORD]
DB_PORT=[DB PORT]
DB_DIALECT=postgres # or mysql

JWT_SECRET=[JWT SECRET KEY]
JWT_EXPIRES_IN=1h # or more

EMAIL_HOST=[EMAIL HOST]
EMAIL_PORT=[EMAIL HOST PORT]
EMAIL_SECURE=false # or true
EMAIL_USER=[EMAIL USER]
EMAIL_PASS=[EMAIL PASSWORD]
EMAIL_FROM=[EMAIL FROM]
```

---

### 4. Running the Development Servers

From the root project directory, run:

```bash
npm start
```

This will start both the frontend and backend servers.

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

Ensure the `proxy` is set correctly in `frontend/package.json`:

```json
"proxy": "http://localhost:5000"
```

---

## 🔄 API Proxying

With the proxy set, frontend API calls like this:

```js
fetch("/api/endpoint");
```

will be automatically forwarded to `http://localhost:5000/api/endpoint`.

---

## 📦 Building for Production

### Frontend

```bash
cd frontend
npm run build
```

This creates a production-ready React build in `frontend/build/`.

> ⚠️ Make sure to set your production environment variables in the `.env` file before building.

To deploy:

- Copy the contents of the `build/` folder to your domain's public folder on cPanel.

---

### Backend

To deploy the backend:

1. Copy the contents of the `api/` folder to your Node.js domain folder.
2. Search for "Setup Node.js App" in your cPanel.
3. Enter your configuration and environment variables.
4. Use the terminal or Node.js app to install dependencies:

```bash
npm install
```

5. Restart the app.

---
