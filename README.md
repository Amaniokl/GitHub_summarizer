# Code Insights: GitHub Repository Analyzer 

## Description (This Readme is also generated using this project)

GitYolo is a web application designed for analyzing GitHub repositories. It allows developers to explore a repository's structure, understand its code files, and generate insightful reports.  The application leverages a backend API for cloning, analyzing, and summarizing repository data, providing a user-friendly interface to understand and navigate complex codebases. Key features include:

*   **Repository Cloning and Analysis:** Effortlessly clone and analyze any public GitHub repository.
*   **File Tree Visualization:**  Interactive file tree view for easy navigation of the repository's structure.
*   **LLM-Powered Code Summarization:**  Automated code analysis and architectural summarization using Large Language Models (LLMs).
*   **PDF Report Generation:** Generate downloadable PDF reports containing repository insights.
*   **Language Detection:** Automated language detection.
*   **Caching:** Utilizes Redis for caching analysis results, improving performance.

This project is targeted towards software developers, technical writers, and anyone who needs to quickly understand and document a GitHub repository.

## Technologies Used

*   **Frontend:** React, Radix UI (likely), Zod (for input validation), Context API (likely), MarkdownRenderer (Custom)
*   **Backend:** Express.js
*   **LLM Integration:** Google's Gemini (or similar)
*   **Caching:** Redis
*   **File System Operations:** Git
*   **Other:** Streaming API responses, Component-based UI design

## File Structure

The project is structured as a microservices-oriented application with a clear separation between frontend and backend components.

*   **`frontend/`**: Contains the React application, including UI components for file tree visualization, Markdown rendering, and user interaction.  The component structure is based on a component-based architecture
*   **`backend/`**: Implements the Express.js API for handling repository cloning, analysis, LLM interaction, and data processing.  Responsible for interacting with the Git repository and processing files.
*   **`data-processing/`**: Components for file tree generation, language detection, and utilities for tokenization and batch processing.

## Backend
- `backend/`
  - `nodemon.json`               # Development configuration for the backend
  - `package.json`               # Backend project metadata and dependencies
  - `src/`                       # Source code for backend
    - `bin/`                     # Contains utilities for backend
      - `fileTree.cpp`           # C++ file tree generation utility
    - `controllers/`             # Controllers to handle repository-related logic
      - `repoControllers.js`
    - `detectors/`               # Detects languages and frameworks in repositories
      - `languageFrameworkDetector.js`
    - `routes/`                  # API routes for backend functionality
      - `repoRoutes.js`
    - `services/`                # Services for interacting with external APIs
      - `gitService.js`          # GitHub service for repo interaction
    - `utils/`                   # Utility functions for backend logic
      - `analyzeWithLLM.js`
      - `batchFile.js`
      - `fileTree.js`
      - `readFile.js`
      - `redis.js`
      - `tokenizer.js`
    - `index.js`                 # Main backend entry point

## Frontend
- `frontend/`
  - `components.json`            # List of components for the frontend
  - `eslint.config.js`           # ESLint configuration for frontend
  - `index.html`                 # Main HTML file
  - `jsconfig.json`              # JavaScript configuration for frontend
  - `package.json`               # Frontend project metadata and dependencies
  - `vite.config.js`             # Vite configuration for bundling
  - `src/`                       # Source code for frontend
    - `assets/`                  # Static assets for frontend
      - `react.svg`
    - `components/`              # UI components for frontend
      - `ui/`                    # UI-specific components
        - `alert.jsx`
        - `avatar.jsx`
        - `badge.jsx`
        - `button.jsx`
        - `card.jsx`
        - `collapsible.jsx`
        - `dialog.jsx`
        - `form.jsx`
        - `input.jsx`
        - `label.jsx`
        - `progress.jsx`
        - `scroll-area.jsx`
        - `separator.jsx`
        - `skeleton.jsx`
        - `tabs.jsx`
        - `tooltip.jsx`
    - `contexts/`                # Contexts for managing global state
      - `ThemeContext.jsx`
    - `lib/`                     # Helper libraries
      - `utils.js`
    - `pages/`                   # Pages for routing
      - `Homepage.jsx`
    - `utils/`                   # Utility functions for frontend logic
      - `repoUtils.js`
    - `App.css`                  # Global styles for the app
    - `App.jsx`                  # Main app component
    - `index.css`                # Additional global styles
    - `main.jsx`                 # Main entry point for the frontend

## Root Directory
- `README.md`                   # Project documentation

## Architecture Overview

This project adopts a microservices-oriented architecture, with the frontend and backend acting as distinct services.  The core components and their interactions are as follows:

*   **Frontend:**  Built with React, the frontend is the user interface. It displays the repository information, interacts with the backend API, handles user interactions, and generates PDF reports. It leverages a component-based design for UI elements such as the file tree and Markdown rendering. Uses Zod for input validation.

*   **Backend:** Built with Express.js.  The backend handles all the heavy lifting:
    *   Clones GitHub repositories.
    *   Analyzes code files and their contents.
    *   Interacts with an LLM (likely Google's Gemini) for code analysis, summarization, and architecture documentation generation.
    *   Uses Redis for caching results to improve performance and reduce redundant computations.
    *   Generates a file tree structure from the repository.
    *   Detects the programming languages used in the repository.
    *   Provides a RESTful API with endpoints like `/api/repos/clone`.

*   **Data Flow:**
    1.  The user provides a GitHub repository URL via the frontend.
    2.  The frontend sends a request to the backend API (e.g., `/api/repos/clone`).
    3.  The backend clones the repository.
    4.  The backend performs code analysis and architectural summarization, including interaction with the LLM.
    5.  The backend generates a file tree representation.
    6.  The backend caches the results in Redis.
    7.  The backend streams the data back to the frontend, which renders the file tree, code summaries, and other information.

*   **API Design:** RESTful API architecture with endpoints like `/api/repos/clone`. Streaming responses are utilized to handle large repository data efficiently.

*   **Error Handling:**  Robust error handling is implemented, including `try...catch` blocks and error checking in both frontend and backend.

## Installation

### Prerequisites

*   Node.js (v16 or higher)
*   npm or yarn
*   Redis (for caching - optional but highly recommended)
*   Git

### Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd <project_directory>
    ```

2.  **Install dependencies for both frontend and backend:**

    ```bash
    # Navigate to backend directory (if necessary)
    cd backend
    npm install
    # Or
    yarn install
    cd ..
    cd frontend
    npm install
    # Or
    yarn install
    cd ..
    ```

3.  **Environment Setup:**

    *   Create a `.env` file in the backend directory to configure your environment variables.
    *   You will likely need to set up API keys for LLM interaction (Google's Gemini).
        ```
        # Backend .env file
        LLM_API_KEY=<your_llm_api_key>
        REDIS_URL=<your_redis_url> # e.g., redis://localhost:6379 (optional)
        ```
    *   Configure Redis connection details if you plan to use caching.

4.  **Run the backend:**

    ```bash
    cd backend
    npm start
    # Or
    yarn start
    ```

5.  **Run the frontend:**

    ```bash
    cd frontend
    npm start
    # Or
    yarn start
    ```

    This will typically start a development server, and you can access the application in your browser (e.g., `http://localhost:3000`).

## Usage

1.  **Access the application** in your web browser.
2.  **Enter the GitHub repository URL** you wish to analyze.
3.  **Click the "Analyze" or "Submit" button**.
4.  **Explore the file tree**, view code summaries, and generate reports as provided by the application.

### Example API Usage (Backend - for development/testing)

You can interact with the backend API directly (e.g., using `curl` or Postman):

```bash
# Clone and analyze a repository (replace with your GitHub URL)
curl -X POST -H "Content-Type: application/json" -d '{"repoUrl": "https://github.com/your-username/your-repo"}' http://localhost:3001/api/repos/clone
```
