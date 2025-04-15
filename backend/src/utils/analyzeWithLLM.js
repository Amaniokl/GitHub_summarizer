import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini 1.5 Flash model for per-file summarization
const summarizeBatch = async (batch) => {
  const filesText = batch.map(file => `// ${file.path}\n${file.content}`).join('\n\n');

  const prompt = `You are analyzing a group of source code files that together form a cohesive part of a larger application. Provide a DETAILED, STRUCTURED summary with the following insights:

1. PRIMARY PURPOSE: Clearly state the main functionality these files collectively implement (1-2 sentences).
2. ARCHITECTURE & COMPONENTS:
   - Describe the key architectural patterns used (e.g., MVC, layered, modular).
   - Explain how components, services, or modules are structured and interact.
   - Mention any significant libraries or frameworks leveraged.
3. DATA FLOW & STATE MANAGEMENT:
   - Explain how data flows between components, services, and/or APIs.
   - Note how state is managed (e.g., global/local state, context, Redux, props).
4. ROUTING & NAVIGATION:
   - Describe how routing is configured and how navigation between pages/components works.
   - Mention any protected routes, dynamic routes, or nested route handling.
5. CORE FUNCTIONS & LOGIC:
   - List the main functional responsibilities and what core logic each part handles.
   - Highlight any custom hooks, utilities, middleware, or backend integrations.
6. TECHNICAL INSIGHTS:
   - Point out any noteworthy implementation techniques or trade-offs.
   - Mention performance optimizations, reusable patterns, or code modularity techniques.

Use bullet points and short paragraphs. Stay under 300 words. Do not list files individually.

\`\`\`
${filesText}
\`\`\``;


  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-001' });
  const result = await model.generateContent(prompt);
  return await result.response.text();
};

// Higher-level architecture summary from all batches
const summarizeBatches = async (batches) => {
  const batchSummaries = await Promise.all(
    batches.map(batch => summarizeBatch(batch))
  );
  const combinedSummaries = batchSummaries.join('\n\n');

  const finalPrompt = `You are a senior software architect tasked with producing a **deep architectural and functional analysis** based on multiple source code summaries. Your goal is to help engineers, tech leads, and system architects understand not just *what* this codebase does, but *how* it works internally—its structure, logic flow, and systemic behaviors.

  🧠 Use analytical reasoning and architectural thinking to:
  - Extract how different layers/modules interact and what responsibilities they encapsulate.
  - Uncover how data flows between components, APIs, and external systems.
  - Identify implicit contracts, control flows, and real-time data processing strategies.
  - Highlight implementation trade-offs, maintainability concerns, or technical bottlenecks.
  - Infer security posture, testing strategies, scalability limits, and modularity levels.
  
  💡 Assume your audience has technical depth and seeks:
  - **Non-obvious insights** about how the system behaves under load or edge cases.
  - Understanding of how core functions work *end-to-end*, not just high-level overviews.
  - Reasoning about scalability, flexibility, data consistency, and code quality.
  
  📌 Format your response using the following **EXACT structure**. Each section should contain **2–3 focused and technically meaningful bullet points**, using formal, precise language. Avoid repetition or vague generalizations.
  
  ---
  
  **Overall Architecture**
  - Describe the high-level system architecture (monolith, modular, service-based, SSR/CSR mix, etc.)
  - Identify how responsibilities are distributed across layers or modules (e.g., presentation, business logic, persistence).
  
  **Main Components / Services**
  - Highlight critical services/modules, their roles, and how they interoperate.
  - Mention any separation of concerns or communication interfaces between them (e.g., service APIs, shared utilities, event buses).
  
  **Database Usage**
  - Explain how persistent data is managed, including schema design approaches or ORMs.
  - Describe how the data layer interacts with the business logic layer, and any observable consistency or transactional guarantees.
  
  **API Design & Integration Points**
  - Discuss how external/internal APIs are designed (REST, GraphQL, RPC), and how integration is handled.
  - Mention key endpoint patterns, request/response structure, and inter-service communication protocols.
  
  **Authentication & Authorization**
  - Identify auth mechanisms (JWT, OAuth, sessions), and where/when validation occurs in the stack.
  - Explain how access control is enforced (RBAC, ABAC, route guards, middleware).
  
  **Notable Patterns or Frameworks**
  - Mention recognized architectural or design patterns (MVC, CQRS, repository, observer, etc.).
  - Highlight how framework usage influences code structure (e.g., React hooks, Express middleware, Prisma models).
  
  **Data Flow & State Management**
  - Describe how data flows across components, functions, or layers—including unidirectional/bidirectional flows.
  - Explain state handling mechanisms (props/context, client-side state, server-side caching, reactive updates, etc.).
  - Highlight how data is fetched, transformed, and passed through the system end-to-end.
  
  **Important Functions & Business Logic**
  - Identify the most important functions or handlers and what business-critical logic they encapsulate.
  - Explain the control flow, decision-making logic, or branching behavior that drives application outcomes.
  
  **Error Handling & Resilience**
  - Describe how errors are caught, logged, or surfaced—both client- and server-side.
  - Note retry logic, fallbacks, graceful degradation, or circuit-breaker patterns.
  
  **Code Vulnerabilities & Security Concerns**
  - Point out any possible security weaknesses (e.g., hardcoded secrets, unchecked inputs, unguarded endpoints).
  - Mention how input validation, sanitization, and secure coding practices are implemented (or missing).
  
  **Performance Considerations**
  - Identify areas where caching, batching, lazy loading, or debouncing is used for optimization.
  - Mention any potential bottlenecks in data-heavy loops, API call chains, or database queries.
  
  **Testing & Quality Assurance**
  - Describe unit/integration/e2e testing practices, coverage approaches, or mock strategies.
  - Point out if testability is enhanced by design (e.g., dependency injection, interface separation).
  
  **Deployment & Infrastructure**
  - Explain deployment approach (CI/CD, container orchestration, static builds).
  - Note how environments are managed (e.g., dotenv configs, feature flags, infra-as-code).
  
  **Improvement Opportunities**
  - Suggest areas for modularization, better abstraction, or refactoring for clarity/performance.
  - Highlight quick wins for observability, scalability, or architectural cleanliness.
  
  **Technical Debt Assessment**
  - Call out complex, brittle, or over-coupled areas that may cause maintenance pain.
  - Mention anti-patterns or inconsistencies that reflect rushed or legacy code.
  
  **Documentation Quality**
  - Evaluate the clarity and completeness of comments, README, API docs, and onboarding guides.
  - Point out where lack of documentation may hinder new developers or future scaling.
  
  ---
  
  🧠 Be analytical, not descriptive. Use insight, not repetition. Think like a system designer reverse-engineering a product from its codebase.
  
  \`\`\`
  ${combinedSummaries}
  \`\`\``;
  

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });
  const result = await model.generateContent(prompt);
  const readme = await result.response.text();

  return readme;
};


export { summarizeBatch, summarizeBatches, generateReadme };
