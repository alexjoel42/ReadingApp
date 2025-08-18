# ReadingApp

A web app designed to help early readers practice pronunciation and build reading fluency. Students read aloud phrases, receive real-time feedback on accuracy, sight words, and phonetic patterns—and teachers can review attempts through a dashboard.

---

##  Live Demo

Explore the app live: [Reading App Demo](https://reading-app-rho.vercel.app)

---

##  Features

- **Student Registration & Leveling**  
  Students log in with an ID and select their reading level (e.g. Kindergarten, Grade 1). This selects a set of phrases tailored to that level.

- **Consistent Practice Sets**  
  Each student receives a reproducible yet randomized selection of phrases—ensuring variety without losing familiarity.

- **Real-Time Pronunciation Feedback**  
  Students read phrases aloud; the app evaluates their speech for accuracy, sight words, and phonetic patterns using browser-based speech recognition.

- **Practice Session Flow**  
  Students progress through a series of phrases, navigate through “Next Phrase” or complete the session when done.

- **Teacher Dashboard** *(coming soon)*  
  Teachers view all attempts, review progress, filter by student, and spot reading struggles early.

---

##  Tech Stack

- **Frontend**: React (Vite) with TypeScript for type safety and speed  
- **Speech Recognition**: `react-speech-recognition` for real-time transcription  
- **Pronunciation Evaluation**: Custom logic in `pronunciationEvaluator.ts`  
- **Routing**: React Router for multi-page support (registration, practice, dashboard)  
- **Data Storage**: Local storage (via `getAttemptHistory`, `saveAttempt`, etc.) for persisting attempts—ready to swap in a database later  
- **Styling**: CSS modules scoped to components for separation of concerns

---

##  Getting Started

### Prerequisites

- Node.js 16+ (comes with npm or yarn)
- Git

### Setup

```bash
git clone https://github.com/alexjoel42/ReadingApp.git
cd ReadingApp/ReadingCheck
npm install
npm run dev 
```

Once done you can run 
```bash
npm build 
```
and that will build the project then you can follow a normal pull request progression. 

### Project structure

ReadingCheck/
├── src/
│   ├── components/
│   │   ├── StudentIdForm.tsx
│   │   ├── TeacherDashboard.tsx
│   ├── practice/
│   │   ├── PhraseCard.tsx
│   │   ├── ReadingControls.tsx
│   ├── lib/
│   │   └── pronunciationEvaluator.ts
│   ├── storage.ts
│   ├── constants/
│   │   └── phrases.ts
│   ├── App.tsx
│   └── App.css
├── public/
├── package.json
└── README.md

