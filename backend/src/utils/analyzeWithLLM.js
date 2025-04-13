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

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });
  const result = await model.generateContent(finalPrompt);
  const finalSummary = await result.response.text();

  return {
    finalSummary,
    batchSummaries
  };
};

export { summarizeBatch, summarizeBatches };
