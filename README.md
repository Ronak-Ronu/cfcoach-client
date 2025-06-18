### CF Coach ( [CF-Coach](https://cfcoach.web.app) )
[![Live Demo](https://img.shields.io/badge/live-cfcoach.web.app-blue?style=flat-square)](https://cfcoach.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![ShadCN UI](https://img.shields.io/badge/ShadCN_UI-000000?style=flat-square&logo=shadcn-ui&logoColor=white)](https://ui.shadcn.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

Yet another simple student performance managing platform with AI coach for guiding and feedback.

## Features

- **Student Performance Tracking**:
    - **Codeforces Handle Integration**: Seamlessly link student profiles with their Codeforces accounts.
    - **Submission History Analysis**: Automatically fetch and analyze students' submission history on Codeforces.
    - **Rating Progress Visualization**: Display students' rating changes over time using interactive charts.
    - **Submission Details**: View detailed information about each submission, including problem name, rating, verdict, and submission time.
    - **Performance Heatmap**: Visualize daily submission activity on a calendar heatmap, filtered by submission type (All, Contest, Practice, Virtual).
    - **Data Export**: Export student data, including submission history and contest ratings, to CSV and PDF formats.

- **AI Coach**:
    - **Personalized Feedback Generation**: Leverage the power of Google Gemini API to generate tailored feedback based on student performance.
    - **Weakness Identification**: AI identifies areas where students need improvement based on their submission patterns.
    - **Training Plan Recommendations**: Receive AI-driven suggestions for practice plans to address identified weaknesses.
    - **Daily Problem Recommendations**: Get daily problem suggestions from the AI to help students improve consistently.
    - **Programming Meme Integration**: Inject humor and engagement with relevant programming memes.

- **Teacher Dashboard**:
    - **Student Management**: Easily add, edit, and delete student records.
    - **Progress Monitoring**: Get a quick overview of all students' submission counts and track their progress.
    - **Automated Reminders**: Option to enable automated email reminders for students (requires Firebase setup).
    - **Real-time Data Sync**: Manually trigger data synchronization with Codeforces or rely on automatic polling.
    - **Individual Student Profile**: Navigate to detailed profiles for each student to view their performance and AI insights.

## Future Feature

- More platform integrations (e.g., LeetCode, CodeChef).
- Advanced analytics on problem-solving patterns.
- Customizable training plans based on specific topics or skills.
- Enhanced AI feedback with more granular insights.
- Teacher-created assignments and progress tracking.

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **UI**: ShadCN UI (utilizing Radix UI Primitives) + Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router 6
- **Form Handling**: React Hook Form
- **Charts**: Chart.js
- **Animation**: Framer Motion
- **Heatmap**: D3.js

### Backend
- **Hosting**: Firebase Hosting
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Cloud Functions**: Firebase Functions
- **AI Integration**: Google Gemini API

### External APIs
- Codeforces API - [Documentation](https://codeforces.com/apiHelp)

## Setup Guide

### Prerequisites
- Node.js (version >= 18) and npm installed.
- Firebase project set up if you intend to use the AI coaching features.

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-username/cf-coach.git CF-Coach-Client
```
2. Navigate to the project directory:
```bash
cd CF-Coach-Client
```
3. Install dependencies:
```bash
npm install
```
4. Create a `.env` file in the project root based on the `.env.example` file.
```bash

VITE_BACKEND_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID=VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=VITE_FIREBASE_APP_ID

```
- If you do not wish to use the AI features or Firebase initially, you can skip adding the Firebase configuration in the .env file. The application will run without these features.

5. Start the development server:
```bash
npm run dev
```

