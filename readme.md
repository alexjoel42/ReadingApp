speech-accuracy-checker/
├── src/
│   ├── components/
│   │   ├── HistoryTable.tsx        # Beautiful history data table
│   ├── lib/
│   │   ├── pronunciationEvaluator.ts  # Professional evaluation logic
│   ├── models.ts                   # Data structure definitions
│   ├── firebaseConfig.ts           # Database connection setup
│   ├── App.tsx                     # Main application component
│   ├── App.css                     # All styling
├── public/                         # Static files
├── package.json                    # Project dependencies
└── README.md                       # This file!


Clone the repository

bash
git clone https://github.com/yourusername/speech-accuracy-checker.git
cd speech-accuracy-checker
Install dependencies

bash
npm install
Set up Firebase

Create a Firebase project at https://firebase.google.com/

Copy your config into firebaseConfig.ts

Enable Firestore database

Run the development server

bash
npm start
🌟 Features
Professional Pronunciation Evaluation:

Accuracy percentage scoring

Detailed error breakdown

Constructive feedback

Multiple Challenge Phrases:

3 difficulty levels

Easy navigation

Progress tracking

Beautiful History Tracking:

Sortable attempts table

Visual accuracy indicators

Error classification

Speech Recognition:

Continuous recording

Real-time transcription

Browser-based (no extra software)

🛠️ Dependencies
react-speech-recognition: Browser speech-to-text

string-similarity: Accuracy calculation

firebase: Database storage

react-router: Page navigation

🤔 How It Works
User selects a phrase to practice

Presses record and speaks the phrase

System analyzes their attempt:

Compares to target phrase

Identifies errors

Calculates accuracy

Stores results in database

Displays professional feedback

Tracks all attempts in history table

📝 Customization Tips
Add more phrases:
Edit the PHRASES array in App.tsx

Adjust difficulty:
Modify the evaluation thresholds in pronunciationEvaluator.ts

Change styling:
Edit the color variables in App.css

Connect different database:
Replace Firebase with your preferred database in firebaseConfig.ts