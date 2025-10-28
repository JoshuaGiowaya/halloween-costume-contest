# Halloween Costume Contest

A full-stack photography contest application with user registration, photo submission, and voting functionality.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Environment Setup

1. **Backend Environment Variables**
   ```bash
   # Copy the template and update values
   cp backend.env.template Photography_Contest_Backend/.env
   ```

2. **Frontend Environment Variables**
   ```bash
   # Copy the template and update values
   cp frontend.env.template Photography_Contest_ReactJS/.env
   ```

3. **Update the values** in both `.env` files according to your setup

### Installation & Running

1. **Backend Setup**
   ```bash
   cd Photography_Contest_Backend
   npm install
   npm start
   ```

2. **Frontend Setup**
   ```bash
   cd Photography_Contest_ReactJS
   npm install
   npm start
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

## 📚 Documentation

- [Complete Participation Guide](CONTEST_PARTICIPATION_GUIDE.md) - User instructions
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - Configuration details
- [User Guide](USER_GUIDE.md) - Quick start for users

## 🔧 Configuration

### Key Environment Variables

- `DISABLE_JOIN_WHEN_VOTING_STARTS` - Controls join button during voting
- `MANUAL_CONTEST_CONTROL` - Enables manual contest management
- `API_KEY` - Required for API authentication
- `MONGODB_URI` - Database connection string

See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for complete configuration options.

## 🎯 Features

- User registration and authentication
- Photo submission with file upload
- Contest management (manual or automatic)
- Voting system with real-time updates
- Admin dashboard for contest control
- Responsive design for all devices

## 🛠️ Development

The application consists of:
- **Backend**: Node.js/Express API with MongoDB
- **Frontend**: React.js with Bootstrap styling
- **File Storage**: ImgBB integration for photo hosting
