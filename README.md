# Datasets Pro

A full-stack web application designed for users to browse, upload, download, and manage datasets, featuring an admin-approval workflow for uploads and a modern glassmorphic user interface.

## Features

- **User Authentication**: Secure Login/Registration using traditional Email/Password with `bcryptjs` and Google OAuth integration. Uses JSON Web Tokens (JWT) for stateless session management.
- **Dataset Library & Management**: Users can browse dynamically rendered dataset cards, search via tags, and download datasets.
- **Role-Based Access Control (RBAC)**: Strict authorization system where standard users cannot upload datasets by default. 
- **Admin Privileges**: Built-in Admin dashboard to view standard users, handle upload permission requests, grant/revoke upload access, and delete users (cascading deletion of associated datasets).
- **Secure File Uploads**: Employs `multer` on the backend to handle `multipart/form-data`, saving dataset files directly to the server's local file system with a 30 MB limit.
- **Glassmorphic UI**: Beautiful frontend designed with "Glassmorphism" (`backdrop-filter: blur`), CSS Grid/Flexbox, and dynamic animated backgrounds.

## Project Architecture

### Frontend (Client)
- **Tech Stack**: HTML, CSS, Vanilla JavaScript.
- **Structure**: Single Page Application (SPA) architecture using DOM manipulation (toggling `.hidden` classes) to navigate between Auth screens and the Dashboard.
- **Styling (`style.css`)**: Modern UI with CSS variables, Flexbox, and Grid layouts. Modals are used for interactions like dataset uploads.

### Backend (Server)
- **Tech Stack**: Node.js, Express.js, MongoDB (Mongoose).
- **Database (`models/`)**: Defines `User` and `Dataset` schemas to store metadata and track permissions (`role`, `canUpload`, `uploadRequested`).
- **Security & Middlewares**: Custom Express middlewares (`verifyToken`, `verifyAdmin`) ensure sensitive endpoints are protected.
- **Initialization**: Automatically provisions a master admin account (Username: `admin`, Password: `admin123`) on the first boot if no admin exists. The system also supports automatic promotion for a designated admin email via Google OAuth.

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SUMIT-2006-MH/Datastes.git
   cd Datastes
   ```

2. **Install Server Dependencies:**
   Navigate to the backend and install required packages.
   ```bash
   cd server
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the `server` directory and configure the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```

4. **Start the Backend Server:**
   ```bash
   npm start
   ```

5. **Start the Frontend Client:**
   Serve the `client` directory using a local development server. For example:
   ```bash
   npx serve client
   ```
   Or use the "Live Server" extension in VS Code.

## Usage Guide

- **Admin Access**: Log in with the default admin credentials (`admin` / `admin123`) to access the Admin Panel.
- **Managing Users**: As an admin, you can view all registered users and toggle their upload permissions.
- **Uploading Datasets**: Standard users must request upload access first. Once approved by an admin, the upload modal becomes available, and users can submit dataset files along with metadata (Title, Description, Tags).
- **Deleting Users**: Admins can delete users from the system, which cascades to delete all datasets and physical files associated with that user.
