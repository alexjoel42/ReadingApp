# 📖 ReadingFoundation — System Architecture & Instructions

This document outlines the technical architecture and data flow of the **ReadingFoundation** Progressive Web App (PWA), from phrase ingestion to teacher-facing analytics.

The system is designed for **high-frequency classroom use**, balancing **real-time edge processing** (Speech-to-Text) with **robust persistence** (Dexie / IndexedDB / LocalStorage) to ensure student data is never lost—even with unreliable school Wi-Fi.

---

## 🏗️ High-Level Architecture

The application follows a **Unidirectional Data Flow** pattern centered around a **Hybrid Storage Strategy** that supports multiple instructional modes without fragmenting core logic.

---

## 🔑 Core Principles

- **Polymorphic Content**  
  A single `Phrase` model can represent either:
  - A phonics sentence (fluency)
  - A full 4th-grade reading passage (comprehension)

- **Mode-Based Routing**  
  The UI dynamically switches between **Fluency** and **Comprehension** engines.

- **Deterministic Experience**  
  Seeded shuffling ensures students receive a consistent phrase order across refreshes.

- **Decoupled Result Porting**  
  Specialized “porter” functions handle persistence logic, preventing mode-specific features from breaking core storage.

---

## 🧱 Core Layers

### 1. Speech & Evaluation Layer (Fluency Mode)

- **Speech API**
  - Uses `react-speech-recognition`
  - Includes a **500ms hardware warmup buffer** for accurate timing

- **Evaluation**
  - Custom library: `pronunciationEvaluator.ts`
  - Calculates:
    - Overall accuracy
    - Sight word mastery
    - Phonetic pattern performance

- **Editing**
  - Students may manually edit transcripts to correct Speech-to-Text errors
  - Evaluation runs only on the finalized text

---

### 2. Comprehension Layer (Quiz Mode)

- **Passage Rendering**
  - Displays 4th-grade-level passages with titles and metadata

- **A/B/C/D Interface**
  - Dedicated multiple-choice UI
  - Handles question state and progression internally

- **Scoring**
  - Real-time correct/incorrect scoring
  - Uses a defined `correctAnswer` key per question

---

### 3. Storage Layer (Hybrid Strategy)

The system pulls content from **three distinct sources** to maximize flexibility:

1. **Static Phonics**
   - K–2 phonics sets defined directly in code

2. **Virtual Samples**
   - Hardcoded 4th-grade comprehension passages
   - Used for demos and rapid testing

3. **Dexie.js (IndexedDB)**
   - Teacher-imported CSV / JSON phrase sets
   - Supports both phonics and comprehension content

---

## 🔁 The Multi-Mode Data Loop

### Phase A: Identity & Mode Selection

1. Student enters a `studentId`
2. Student selects a Practice Set
3. Student chooses:
   - **Start Reading Practice** (Fluency)
   - **Start Comprehension** (Quiz)

`App.tsx` routes the user to the appropriate engine based on this selection.

---

### Phase B: Execution

- **Fluency Flow**
  - Real-time transcription
  - Phonetic and sight word evaluation

- **Comprehension Flow**
  - Passage display
  - Followed by inferential or recall-based questions

---

### Phase C: Porting Results

Different persistence strategies are used depending on the mode:

- **Fluency Mode**
  - Uses `recordAttempt`
  - Updates:
    - Attempt history
    - Mastery status (90% threshold)
    - Cumulative progress

- **Comprehension Mode**
  - Uses a specialized Results Porter: `store_results.ts`
  - Formats quiz scores into the standard `attempts` table
  - Avoids polluting phonetic mastery and fluency progress tables

---

## 📊 Database Schema (v4) & Unified Model

### Unified Phrase Interface

To support both modes without breaking core logic, the `Phrase` model is polymorphic:

```ts
export interface Phrase {
  id: string;
  text: string;

  // Phonics Fields (Optional)
  sightWords?: string[];
  phoneticPatterns?: string[];

  // Comprehension Fields (Optional)
  title?: string;
  questions?: ComprehensionQuestion[];
}
