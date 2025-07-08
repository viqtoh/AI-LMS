Full Stack App: React + Express
This project is a full-stack web application with:

A React frontend located in the frontend/ directory

An Express.js backend located in the api/ directory

🗂️ Project Structure
root/
├── frontend/      # React application
├── api/           # Express backend API
└── README.md


⚙️ Prerequisites
Make sure you have the following installed:

Node.js (v16 or newer recommended)

npm or yarn

🚀 Getting Started
1. Clone the repository
git clone [GIT REPO URL]
cd AI-LMS


3. Install Dependencies
cd frontend
npm install
# or
yarn install
Backend
cd ../api
npm install
# or
yarn install

4. Add ENV files
   add .env file in frontend/ folder
   file should contain:
   REACT_APP_API_BASE_URL=http://localhost:5000
   REACT_APP_IMAGE_HOST=http://localhost:5000

   add .env file in api/ folder
   file should contain:
   DB_USER=[DB USER]
   DB_HOST=[DB HOST]
   DB_NAME=[DB NAME]
   DB_PASSWORD=[DB PASSWORD]
   DB_PORT=[DB PORT]
   DB_DIALECT=["postgres" or "mysql"]
   JWT_SECRET=[JWT SECRET KEY]
   JWT_EXPIRES_IN=["1h" or more]
   EMAIL_HOST=[EMAIL HOST]
   EMAIL_PORT=[EMAIL HOST PORT]
   EMAIL_SECURE=[true or false]
   EMAIL_USER=[EMAIL USER]
   EMAIL_PASS=[EMAIL PASSWORD]
   EMAIL_FROM=[EMAIL FROM]



3. Running the Development Servers
Start the Server
From the root directory:

npm start
By default, the frontend runs on http://localhost:3000 and backend runs on http://localhost:5000

It should be set up to proxy API requests to the backend. Check the proxy field in frontend/package.json:
"proxy": "http://localhost:5000"
🔄 API Proxying
With the proxy set, frontend API calls like:

📦 Building for Production
cd frontend
npm run build
This creates a production-ready React build in frontend/build/.
note: you must set production env vars in .env file before building
copy the content of your build folder to the domain folder in cpanel

for backend
copy the contents of /api to the domain folder
search for set up node js app
enter config and env vars
install dependencies using terminal or the nodejs app
restart app
