import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini 1.5 Flash model for per-file summarization
const summarizeBatch = async (batch) => {
  const filesText = batch.map(file => `// ${file.path}\n${file.content}`).join('\n\n');

  const prompt = `Analyze this batch of related source code files as a cohesive unit. Provide a CONCISE, STRUCTURED summary focusing ONLY on:

1. PRIMARY PURPOSE: Core functionality these files collectively implement (1-2 sentences)
2. ARCHITECTURE: Key patterns, classes, or modules observed (max 3 bullet points)
3. SYSTEM CONTEXT: How this component likely fits into the larger system (1-2 sentences)
4. TECHNICAL INSIGHTS: Most significant implementation details or design decisions (max 3 bullet points)

Keep your response under 200 words. Focus on high-value insights that would be relevant for further architectural analysis. Avoid listing files individually.

\`\`\`
${filesText}
\`\`\``;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
  const result = await model.generateContent(prompt);
  return await result.response.text();
};

// Higher-level architecture summary from all batches
const summarizeBatches = async (batches) => {
  const batchSummaries = await Promise.all(
    batches.map(batch => summarizeBatch(batch))
  );
  const combinedSummaries = batchSummaries.join('\n\n');

  const finalPrompt = `You are a senior software architect tasked with synthesizing a **high-level architectural overview** from summaries of multiple project source files. Your audience includes technical decision-makers who need insights on how this system is designed, how its components interact, and what best practices or concerns may exist.

  Your response must provide a **structured, professional architecture analysis**, not a list of implementation details. Use deductive reasoning to extract meaningful insights from the summaries. Avoid redundancy and verbosity.
  
  🔍 **What to Focus On**:
  - System structure, modularity, and boundaries
  - Data flow and integration between components
  - Technology choices and their implications
  - Design patterns or architectural decisions (explicit or implied)
  - Security, scalability, maintainability, and testability concerns
  - Performance optimization opportunities and bottlenecks
  - Error handling and resilience strategies
  - Code quality metrics and technical debt indicators
  - Dependency management and third-party integration approaches
  
  📌 **Format your response using the following exact structure**. Limit each heading to **2–3 bullet points max**, using clear, formal, technical language:
  
  ---
  
  **Overall Architecture**
  - (e.g., monolithic, layered, microservices, modular structure, SSR, etc.)
  
  **Main Components / Services**
  - Key modules/services and their system-wide responsibilities or interactions
  
  **Database Usage**
  - Databases used, schema design, ORMs, data access logic, persistence patterns
  
  **API Design & Integration Points**
  - API architecture, protocols, endpoint design patterns, and external integrations
  
  **Authentication & Authorization**
  - Authentication flows, authorization models, security protocols, and session handling
  
  **Notable Patterns or Frameworks**
  - Recognizable frameworks or design patterns in use (MVC, CQRS, Pub/Sub, etc.)
  
  **Data Flow & State Management**
  - How data moves through the system, state management approaches, and key transformations
  
  **Important Functions & Business Logic**
  - Core functions representing critical business logic or system operations
  
  **Error Handling & Resilience**
  - Approaches to exception management, fault tolerance, and recovery strategies
  
  **Code Vulnerabilities & Security Concerns**
  - Potential security issues, injection risks, authorization gaps, or sensitive data exposure
  
  **Performance Considerations**
  - Resource utilization, caching strategies, optimization opportunities, and potential bottlenecks
  
  **Testing & Quality Assurance**
  - Testing strategies, coverage approach, and validation methodologies
  
  **Deployment & Infrastructure**
  - CI/CD pipeline, containerization, environment management, and scaling approach
  
  **Improvement Opportunities**
  - Recommendations for enhancing performance, maintainability, or architecture
  
  **Technical Debt Assessment**
  - Areas of codebase that require refactoring or modernization
  
  **Documentation Quality**
  - State of code documentation, API specs, and developer onboarding materials
  
  ---
  
  Be precise and analytical. Do not simply rephrase summaries—**infer**, **abstract**, and **synthesize** insights. Think like a systems architect doing a design review.
  
  ${combinedSummaries}`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
  const result = await model.generateContent(finalPrompt);
  const finalSummary = await result.response.text();

  return {
    finalSummary,
    batchSummaries
  };
};

const generateReadme = async (fileTreePromise, finalSummary, batchSummaries) => {
  const prompt = `
You are a seasoned open-source contributor and senior software engineer.

Your task is to generate a **well-structured, professional-quality README.md** file in **Markdown** format for a developer-facing project.

This README will be published on GitHub and should **clearly communicate** the purpose, structure, and usage of the project. Make it clean, concise, technically sound, and beginner-friendly.

---

📂 **Project File Tree**:
\`\`\`
${fileTreePromise}
\`\`\`

🧠 **High-Level Architecture Summary**:
\`\`\`
${finalSummary}
\`\`\`

📦 **Component Breakdown (Batch Summaries)**:
\`\`\`
${batchSummaries.join('\n\n')}
\`\`\`

---

✅ **README Generation Guidelines**:

Use proper Markdown formatting and include the following sections:

1. **# Project Title**
   - A concise, relevant name.

2. **## Description**
   - What this project does.
   - Who it's for.
   - Key use-cases and features.

3. **## Technologies Used**
   - List major technologies/libraries/frameworks.

4. **## File Structure**
   - Briefly describe the file structure using the file tree above.
   - Highlight important directories/components.

5. **## Architecture Overview**
   - Use the high-level and batch summaries to describe the internal design.
   - Mention modules, flows, APIs, or system interactions as relevant.

6. **## Installation**
   - Prerequisites (Node, Docker, etc.)
   - Setup instructions (clone, install dependencies, env setup)

7. **## Usage**
   - How to run the project.
   - Example commands or API usage.

8. **## Contributing**
   - Guidelines or links to a \`CONTRIBUTING.md\` file.

9. **## License**
   - Name the license (e.g., MIT) and optionally provide a link.

10. **(Optional) ## FAQ or Troubleshooting**
    - Answer common developer questions if applicable.

---

💡 **Tone and Style Guidelines**:
- Developer-friendly
- Informative but approachable
- Include **code blocks**, **lists**, and **badges** where useful
- Prioritize clarity over verbosity
- Assume the reader has some technical background but is new to this repo

Now, generate a complete and polished \`README.md\`:
`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const readme = await result.response.text();

  return readme;
};



export { summarizeBatch, summarizeBatches, generateReadme };
