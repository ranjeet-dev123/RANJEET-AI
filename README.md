# 🤖 RajAI

### Your Personal Local AI Assistant

**Privacy-first • Fully Local • No Cloud • No API Keys**

RajAI is a privacy-focused, locally running AI assistant built with **React, FastAPI, Ollama, SQLite, and ChromaDB**.

It provides a ChatGPT-like experience while keeping AI processing and application data on your own machine.

[![RajAI](https://img.shields.io/badge/RajAI-Local%20AI-blueviolet?style=for-the-badge)](https://github.com/ranjeet-dev123/rajai)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square\&logo=python\&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square\&logo=react\&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square\&logo=fastapi\&logoColor=white)](https://fastapi.tiangolo.com)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20LLM-black?style=flat-square)](https://ollama.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Features • Architecture • Quick Start • Usage • Tech Stack • Project Structure • Configuration • Roadmap**

---

## 📖 Table of Contents

* [About](#-about)
* [Features](#-features)
* [Architecture](#-architecture)
* [Data Flow](#-data-flow)
* [Quick Start](#-quick-start)
* [Usage](#-usage)
* [Tech Stack](#-tech-stack)
* [Project Structure](#-project-structure)
* [Configuration](#-configuration)
* [Troubleshooting](#-troubleshooting)
* [Roadmap](#-roadmap)
* [Contributing](#-contributing)
* [Author](#-author)
* [Acknowledgments](#-acknowledgments)
* [License](#-license)

---

## 🎯 About

**RajAI** is a local AI assistant designed for developers, students, and privacy-conscious users.

Unlike traditional cloud-based AI applications, RajAI uses **Ollama to run Large Language Models locally** and communicates with them through a FastAPI backend.

### Why RajAI?

| Traditional AI                 | RajAI                                          |
| ------------------------------ | ---------------------------------------------- |
| ☁️ Cloud-based processing      | 💻 Local processing                            |
| 🔑 API keys required           | 🆓 No API key required                         |
| 📤 Data sent to remote servers | 🔒 Data stays on your machine                  |
| 🌐 Internet typically required | ✈️ Can work offline after models are installed |
| 💳 Subscription/API costs      | 🆓 No API usage cost                           |
| 📊 Usage limits                | ♾️ No cloud usage limits                       |

> **Note:** RajAI itself is designed for local processing. Internet access may still be required initially to download Ollama models and project dependencies.

---

# ✨ Features

## 🧠 Core AI

* **100% Local AI** powered by Ollama
* Support for multiple local LLMs
* Llama 3.2 support
* Qwen 2.5 support
* Gemma 2 support
* Real-time streaming responses
* Hinglish-friendly conversations
* Configurable model parameters
* No external AI API required

## 📚 RAG & Documents

* PDF document upload
* PDF-based question answering
* Retrieval-Augmented Generation (RAG)
* Automatic PDF text extraction
* Document chunking
* Vector embeddings
* ChromaDB vector storage
* Relevant context retrieval
* Isolated context for individual PDFs
* Built-in PDF viewer
* PDF document library

## 💾 Chat History

* SQLite-backed conversation storage
* Automatic conversation saving
* Persistent chat history
* Reopen previous conversations
* Delete conversations
* History survives application restarts

## ⚡ Performance

* Local CPU-based inference
* Configurable CPU thread usage
* Adjustable context window
* Adjustable token generation limit
* Lightweight local architecture
* Optimized for personal computers

## 🎨 Modern UI

* ChatGPT-inspired interface
* Dark theme
* Responsive layout
* Model selector
* Sidebar chat history
* PDF library
* Real-time response rendering
* Markdown support

---

# 🏗️ Architecture

```text
┌──────────────────────────────────────────────────────────┐
│                         RAJAI                             │
└──────────────────────────────────────────────────────────┘

                        FRONTEND
              ┌─────────────────────────┐
              │ React 18 + Vite          │
              │ Tailwind CSS             │
              │ Port: 5173              │
              └────────────┬────────────┘
                           │
                    HTTP / Streaming
                           │
                           ▼
                        BACKEND
              ┌─────────────────────────┐
              │ FastAPI + Python        │
              │ Port: 8000              │
              └────────────┬────────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌──────────┐
        │ Ollama  │   │ SQLite  │   │ ChromaDB │
        │         │   │         │   │          │
        │ Local   │   │ Chat    │   │ RAG      │
        │ LLM     │   │ History │   │ Vectors  │
        └─────────┘   └─────────┘   └──────────┘
             │             │             │
             ▼             ▼             ▼
        AI Response    Conversations   Documents
```

---

# 🔄 Data Flow

```text
User enters a message
        │
        ▼
React Frontend
        │
        │ POST /chat/stream
        ▼
FastAPI Backend
        │
        ├── No PDF context
        │       │
        │       ▼
        │     Ollama
        │
        └── PDF context selected
                │
                ▼
             ChromaDB
                │
                ▼
        Retrieve relevant chunks
                │
                ▼
        Augment AI prompt
                │
                ▼
             Ollama
                │
                ▼
         Streaming response
                │
                ▼
        FastAPI / SSE
                │
                ▼
         React Frontend
                │
                ▼
         Display response
                │
                ▼
             SQLite
                │
                ▼
        Save conversation
```

---

# 🚀 Quick Start

## 📋 Prerequisites

Install the following tools before running RajAI:

| Tool    | Version | Purpose               |
| ------- | ------: | --------------------- |
| Python  |   3.10+ | Backend               |
| Node.js |     18+ | Frontend              |
| Ollama  |  Latest | Local LLM runtime     |
| Git     |  Latest | Repository management |

### Downloads

* [Python](https://www.python.org/)
* [Node.js](https://nodejs.org/)
* [Ollama](https://ollama.com/download)
* [Git](https://git-scm.com/)

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/ranjeet-dev123/rajai.git
cd rajai
```

---

## 2️⃣ Setup Ollama

Install Ollama and download the default model:

```bash
ollama pull llama3.2
```

### Optional Models

```bash
ollama pull qwen2.5:1.5b
ollama pull llama3.2:1b
ollama pull gemma2:2b
```

---

## 3️⃣ Setup Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## 4️⃣ Setup Frontend

Return to the project root:

```bash
cd ..
```

Install Node.js dependencies:

```bash
npm install
```

---

# ▶️ Run RajAI

RajAI requires three running services:

### Terminal 1 — Ollama

```bash
ollama serve
```

### Terminal 2 — FastAPI Backend

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### Terminal 3 — React Frontend

From the project root:

```bash
npm run dev
```

---

## 🌐 Open RajAI

Open your browser and visit:

```text
http://localhost:5173
```

Your local RajAI instance should now be running.

---

# 📖 Usage

## 💬 Basic Chat

1. Open RajAI in your browser.
2. Select an available AI model.
3. Enter your message.
4. Press `Enter` to send.
5. Use `Shift + Enter` for a new line.
6. The AI response will appear in real time.

### Example

```text
Mujhe Python mein OOP concepts explain karo.
```

RajAI can handle both English and Hinglish conversations.

---

# 📚 PDF Q&A

RajAI supports document-based conversations using RAG.

### Steps

1. Click the attachment button.
2. Select a PDF.
3. Wait for document processing.
4. RajAI extracts and chunks the PDF content.
5. The chunks are converted into vector embeddings.
6. Relevant chunks are retrieved when you ask questions.
7. Ollama generates an answer using the retrieved context.

### Example

```text
Document:
Machine_Learning_Basics.pdf

Question:
What is gradient descent according to this document?
```

---

# 📄 PDF Library

Uploaded PDFs are available through the document library.

Features include:

* View uploaded documents
* Open PDFs inside the application
* Switch between documents
* Ask questions about selected documents
* Maintain isolated document contexts

---

# 🗂️ Chat History

RajAI automatically stores conversations in SQLite.

You can:

* Create conversations
* Continue previous conversations
* Reopen old chats
* Delete conversations
* Keep history after restarting RajAI

---

# 🛠️ Tech Stack

| Layer           | Technology            | Purpose                   |
| --------------- | --------------------- | ------------------------- |
| Frontend        | React 18              | User interface            |
| Build Tool      | Vite                  | Development/build tooling |
| Styling         | Tailwind CSS          | UI styling                |
| Markdown        | react-markdown        | AI response rendering     |
| Backend         | FastAPI               | REST API and streaming    |
| Server          | Uvicorn               | ASGI server               |
| LLM Runtime     | Ollama                | Local model execution     |
| Default Model   | Llama 3.2             | Local AI inference        |
| Database        | SQLite                | Chat history              |
| Vector Database | ChromaDB              | RAG vector storage        |
| Embeddings      | sentence-transformers | Text embeddings           |
| PDF Parser      | PyPDF2                | PDF text extraction       |

---

# 📁 Project Structure

```text
rajai/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── requirements.txt
│   │
│   ├── routers/
│   │   ├── chat.py
│   │   ├── conversations.py
│   │   └── rag.py
│   │
│   └── rag/
│       ├── pdf_loader.py
│       ├── chunker.py
│       ├── embedder.py
│       └── retriever.py
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── public/
│
├── .gitignore
├── README.md
├── package.json
├── vite.config.js
└── index.html
```

---

# ⚙️ Configuration

## 🎛️ AI Performance Tuning

AI generation settings can be configured in:

```text
backend/routers/chat.py
```

Example:

```python
options = {
    "num_thread": 6,
    "num_predict": 384,
    "num_ctx": 2048,
    "temperature": 0.6,
}
```

### Parameters

| Parameter     | Description                              |
| ------------- | ---------------------------------------- |
| `num_thread`  | Number of CPU threads used for inference |
| `num_predict` | Maximum number of generated tokens       |
| `num_ctx`     | Context window size                      |
| `temperature` | Controls response randomness             |

### General Guidance

| Setting       | Lower Value        | Higher Value     |
| ------------- | ------------------ | ---------------- |
| `num_thread`  | Lower CPU usage    | Faster inference |
| `num_predict` | Shorter responses  | Longer responses |
| `num_ctx`     | Lower memory usage | More context     |
| `temperature` | More focused       | More creative    |

> Recommended values depend on your CPU, available RAM, model size, and workload.

---

# 🤖 Change AI Model

RajAI can support multiple Ollama models.

### Example

```javascript
const [model, setModel] = useState("llama3.2:latest");
```

### Available Models

| Model             | Approx. Size | Best For                 |
| ----------------- | -----------: | ------------------------ |
| `llama3.2:latest` |           2B | General use              |
| `qwen2.5:1.5b`    |         1.5B | Fast responses           |
| `llama3.2:1b`     |           1B | Lightweight systems      |
| `gemma2:2b`       |           2B | Balanced local inference |

You can also check installed models with:

```bash
ollama list
```

---

# 🐛 Troubleshooting

## ❌ Connection Refused

### Cause

The FastAPI backend is not running.

### Solution

```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

---

## ❌ Failed to Fetch

Possible causes:

* Backend is not running
* Incorrect backend port
* CORS configuration issue
* Firewall/network configuration

Verify that FastAPI is available at:

```text
http://localhost:8000
```

---

## ❌ PDF Text Not Found

### Cause

The PDF may be a scanned document containing images instead of selectable text.

### Solution

Use a text-based PDF or process the document using OCR.

> OCR support is planned for a future RajAI version.

---

## ❌ Slow AI Responses

Try:

```text
Lower num_predict
Use a smaller model
Reduce num_ctx
Close heavy applications
Reduce CPU thread usage if the system becomes overloaded
```

For lightweight systems, try:

```bash
ollama pull qwen2.5:1.5b
```

---

## ❌ Laptop Heating

If CPU usage becomes too high:

```python
"num_thread": 4
```

You can also reduce:

```python
"num_predict": 256
```

Make sure the laptop has adequate ventilation during long inference sessions.

---

## ❌ Ollama Not Found

Check the installation:

```bash
ollama --version
```

Start the Ollama server:

```bash
ollama serve
```

Check installed models:

```bash
ollama list
```

---

# 🗺️ Roadmap

| Phase     | Feature                         | Status      |
| --------- | ------------------------------- | ----------- |
| Phase 1   | Foundation Setup                | ✅ Completed |
| Phase 2   | React + Tailwind UI             | ✅ Completed |
| Phase 3.1 | Chat History — SQLite           | ✅ Completed |
| Phase 3.2 | Streaming Responses             | ✅ Completed |
| Phase 3.3 | RAG — PDF Q&A                   | ✅ Completed |
| Phase 3.4 | PDF Library + Viewer            | ✅ Completed |
| Phase 4   | Voice Input — Whisper           | 🔜 Planned  |
| Phase 5   | AI-Generated Notes — PDF Output | 🔜 Planned  |
| Phase 6   | Handwritten Notes OCR           | 🔜 Planned  |
| Phase 7   | Multi-User Support              | 🔜 Planned  |
| Phase 8   | Fine-Tuned RajAI Model          | 🔜 Planned  |

---

# 🤝 Contributing

Contributions are welcome!

If you want to contribute to RajAI:

### 1. Fork the repository

```bash
git clone https://github.com/ranjeet-dev123/rajai.git
```

### 2. Create a feature branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make your changes

Implement and test your feature.

### 4. Commit your changes

```bash
git add .
git commit -m "Add amazing feature"
```

### 5. Push the branch

```bash
git push origin feature/amazing-feature
```

### 6. Open a Pull Request

Create a Pull Request on GitHub with a clear description of your changes.

### Contribution Guidelines

* Follow the existing project structure.
* Keep code clean and maintainable.
* Use meaningful variable and function names.
* Write clear commit messages.
* Test changes before submitting.
* Update documentation when necessary.

---

# 👨‍💻 Author

## Ranjeet

Developer and creator of **RajAI**.

[![GitHub](https://img.shields.io/badge/GitHub-ranjeet--dev123-181717?style=for-the-badge\&logo=github)](https://github.com/ranjeet-dev123)

[![RajAI](https://img.shields.io/badge/Project-RajAI-blueviolet?style=for-the-badge)](https://github.com/ranjeet-dev123/rajai)

---

# 🙏 Acknowledgments

RajAI is built using several excellent open-source technologies:

* [Ollama](https://ollama.com/) — Local LLM runtime
* [FastAPI](https://fastapi.tiangolo.com/) — Python web framework
* [React](https://react.dev/) — Frontend library
* [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS framework
* [ChromaDB](https://www.trychroma.com/) — Vector database
* [Meta Llama](https://www.llama.com/) — Large Language Models
* [Sentence Transformers](https://www.sbert.net/) — Embedding models

---

# 📜 License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.

---

# ⭐ Support RajAI

If you find RajAI useful, consider giving the repository a ⭐ on GitHub.

It helps support the project and encourages further development.

**Made with ❤️ in India 🇮🇳**

[⬆️ Back to Top](#-rajai)
