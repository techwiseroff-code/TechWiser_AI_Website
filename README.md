<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TechWiser – AI Website & App Builder 🚀

TechWiser is an innovative, **Artificial Intelligence-driven web development platform** that bridges the gap between human creativity and technical execution. By leveraging Large Language Models (LLMs) via the OpenRouter API, TechWiser allows you to describe your vision in plain natural language, and it autonomously generates high-quality, responsive code with an instant live preview. 

Democratize web development—build your next portfolio site, landing page, or small-scale web application entirely for free, directly from your browser!

## ✨ Key Features

- **Prompt-Based Generation**: Just type what you want to build in plain English, and the AI translates your intent into structured, production-ready React / Tailwind code.
- **Phased File Generation**: The AI intelligently plans out the components it needs (e.g., `Header.jsx`, `Pricing.jsx`) before sequentially generating their contents.
- **Instant Live Preview**: Powered by CodeSandbox's **Sandpack**, TechWiser provides an isolated, live browser environment so you can instantly see and interact with your AI-generated app.
- **Iterative Refinement**: Speak with the AI in a split-pane chat interface to continuously tweak, update, or add features to your live application.
- **Completely Free to Use**: Bypassing expensive subscriptions by leveraging free-tier APIs and open-source models.

## 🛠️ Tech Stack

TechWiser is built using a modern Full-Stack Web Architecture:
- **Frontend**: [Next.js](https://nextjs.org/) (App Router) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend as a Service**: [Convex](https://www.convex.dev/) (For real-time user workspaces and chat history)
- **AI Orchestration**: Next.js API Routes connecting to the OpenRouter API (Gemini, DeepSeek, Mistral, etc.)
- **Code Execution Environment**: [Sandpack](https://sandpack.codesandbox.io/) by CodeSandbox

## 🚀 Run Locally

Follow these steps to set up the development environment on your local machine.

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- An **OpenRouter API Key** or **Gemini API Key** (for LLM generation)
- A **Convex** account (for backend generation storage)

### Installation Steps

1. **Clone the repository & Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env.local` file in the root of the project and add your necessary API keys:
   ```env
   # Example keys needed depending on the module
   GEMINI_API_KEY=your_gemini_api_key_here
   # Or OpenRouter, Convex env variables if configured
   CONVEX_DEPLOYMENT=your_convex_deployment
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   ```

3. **Start the local backend services (Convex):**
   ```bash
   npx convex dev
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the App:**
   Visit `http://localhost:3000` in your browser.

## 🔮 Future Enhancements
- **Voice-to-Code**: Integration of Web Speech API for hands-free website building.
- **Multi-language Support**: Localizing the dashboard for diverse regional users.
- **One-Click Deploy**: Push the generated apps directly to platforms like Vercel or Netlify.
- **Image Generation**: Build custom graphical assets by integrating DALL-E or Stable Diffusion into the UI.

## 📄 License
This project is open-source and free to use. 
