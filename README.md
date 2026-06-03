# Outpost Backend

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green.svg)

**Outpost** is a RESTful API service designed to support a collaborative project management system. The system enables teams to organize projects, manage tasks with subtasks, maintain project notes, and handle secure user authentication with role-based access control.

## 🚀 Core Features

### 🔐 User Authentication & Authorization
- Secure Registration & Login with JWT tokens.
- Role-Based Access Control with three tiers: `Admin`, `Project Admin`, and `Member`.
- Email verification process for enhanced account security.
- Password management including Forgot/Reset password functionality via email tokens.

### 📋 Project Management
- Complete project lifecycle management (Create, Read, Update, Delete).
- Role-based project visibility and updates.

### 👥 Team Member Management
- Invite users to projects via email.
- Assign and dynamically update member roles within a project.

### ✅ Task & Subtask Management
- Create tasks with titles, descriptions, assignees, and file attachments.
- Track task status efficiently: `todo`, `in_progress`, `done`.
- Hierarchical task structure with nested subtasks.

### 📝 Project Notes
- Dedicated space for project documentation and shared notes (managed based on user roles).

## 🛠️ Technology Stack
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Authentication:** JSON Web Tokens (JWT) & bcrypt for password hashing
- **Email Services:** Nodemailer, Resend, Mailgen
- **Validation:** express-validator
- **Security & Middleware:** CORS, cookie-parser, Multer (for file uploads)

## 🔑 Role & Permission Matrix

| Feature | Admin | Project Admin | Member |
| :--- | :---: | :---: | :---: |
| Create / Update / Delete Project | ✓ | ✗ | ✗ |
| Manage Project Members | ✓ | ✗ | ✗ |
| Create / Update / Delete Tasks | ✓ | ✓ | ✗ |
| View Tasks | ✓ | ✓ | ✓ |
| Update Subtask Status | ✓ | ✓ | ✓ |
| Create / Delete Subtasks | ✓ | ✓ | ✗ |
| View Notes | ✓ | ✓ | ✓ |
| Create / Update / Delete Notes | ✓ | ✗ | ✗ |

## 🚦 API Endpoints

### 🟢 Implemented Endpoints

#### 🔐 Authentication & Account Management (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/register` | Register a new user | ✗ |
| `POST` | `/login` | Authenticate user & get tokens | ✗ |
| `POST` | `/logout` | Log out user & invalidate token | ✓ |
| `GET` | `/current-user` | Get current logged-in user profile | ✓ |
| `POST` | `/change-password` | Change current user's password | ✓ |
| `POST` | `/refresh-token` | Refresh expired access tokens | ✗ |
| `GET` | `/verify-email/:verificationToken` | Verify email via verification token | ✗ |
| `POST` | `/resend-email-verification` | Resend verification email | ✓ |
| `POST` | `/forgot-password` | Request password reset email | ✗ |
| `POST` | `/reset-password/:resetToken` | Reset password using token | ✗ |

#### 🩺 Health Monitor (`/api/v1/healthcheck`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/` | Checks system & database health status | ✗ |

### 🟡 Planned Endpoints (To Be Implemented)
- **Projects (`/api/v1/projects/*`):** CRUD Operations on projects, member invitation, role management.
- **Tasks (`/api/v1/tasks/*`):** Task lifecycle management, subtasks, assignees, and file attachments.
- **Notes (`/api/v1/notes/*`):** Project documentation and notes management.

*(Detailed request/response schemas can be found in the API documentation or Postman collection)*

## 📦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/smt2208/Project-Management.git
   cd Project-Management
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Setup environment variables
   Copy the example environment variables file:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and configure your credentials (e.g., MongoDB URI, JWT Secrets, Resend API key).

4. Start the development server
   ```bash
   npm run dev
   ```

## 📄 License
This project is licensed under the ISC License.
