import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API = "http://localhost:8000";

const suggestions = [
  { icon: "☕", title: "Learn Java", text: "Explain Java OOP concepts simply" },
  { icon: "🧠", title: "Practice DSA", text: "Give me a Java DSA problem" },
  { icon: "📝", title: "College Assignment", text: "Help me prepare a 5-mark answer" },
  { icon: "⚡", title: "Test Me", text: "Create 10 MCQs from my subject" },
];

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [model, setModel] = useState("llama3.2:latest");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // PDF states
  const [attachedPdf, setAttachedPdf] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedPdfs, setUploadedPdfs] = useState([]);

  // 👈 Naye states (Change 2)
  const [pdfList, setPdfList] = useState([]);
  const [viewingPdf, setViewingPdf] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ═══════════════════════════════════════════════════
  // Load conversations Message
  // ═══════════════════════════════════════════════════
  const loadConversations = async () => {
    try {
      const res = await fetch(`${API}/conversations/`);
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  // ═══════════════════════════════════════════════════
  // Load PDF list (Change 2)
  // ═══════════════════════════════════════════════════
  const loadPdfList = async () => {
    try {
      const res = await fetch(`${API}/rag/list`);
      const data = await res.json();
      setPdfList(data.pdfs || []);
    } catch (err) {
      console.error("Failed to load PDFs:", err);
    }
  };

  useEffect(() => {
    loadConversations();
    loadPdfList();
  }, []);

  // ═══════════════════════════════════════════════════
  // Open conversation
  // ═══════════════════════════════════════════════════
  const openConversation = async (id) => {
    try {
      const res = await fetch(`${API}/conversations/${id}`);
      const data = await res.json();
      setActiveConversationId(id);
      setMessages(
        data.messages.map((m) => ({
          role: m.role === "assistant" ? "ai" : "user",
          content: m.content,
        }))
      );
    } catch (err) {
      console.error("Failed to open conversation:", err);
    }
  };

  // ═══════════════════════════════════════════════════
  // New chat
  // ═══════════════════════════════════════════════════
  const newChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setMessage("");
    setAttachedPdf(null);
  };

  // ═══════════════════════════════════════════════════
  // Delete conversation
  // ═══════════════════════════════════════════════════
  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Ye chat delete karni hai?")) return;

    try {
      await fetch(`${API}/conversations/${id}`, { method: "DELETE" });
      if (activeConversationId === id) newChat();
      loadConversations();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ═══════════════════════════════════════════════════
  // PDF UPLOAD (Change 1 — collection save karo)
  // ═══════════════════════════════════════════════════
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      alert("Sirf PDF file allowed hai");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/rag/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.detail || data.error) {
        alert(`Error: ${data.detail || data.error}`);
      } else {
        const pdfInfo = {
          name: file.name,
          size: (file.size / 1024).toFixed(0) + " KB",
          chunks: data.chunks,
          characters: data.characters,
          docId: data.doc_id,
          collection: data.collection,   // 👈 ADD
        };
        setAttachedPdf(pdfInfo);
        setUploadedPdfs((prev) => [...prev, pdfInfo]);
        loadPdfList();                    // 👈 sidebar refresh
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ═══════════════════════════════════════════════════
  // SEND MESSAGE (Change 5 — collection bhejo)
  // ═══════════════════════════════════════════════════
  const sendMessage = async () => {
    const text = message.trim();
    if (!text || isLoading) return;

    const currentCollection = attachedPdf?.collection || null;   // 👈

    const userMessage = {
      role: "user",
      content: text,
      attachedPdf: attachedPdf,
    };
    const updatedMessages = [...messages, userMessage];

    setMessages([...updatedMessages, { role: "ai", content: "" }]);
    setMessage("");
    setAttachedPdf(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: activeConversationId,
          messages: updatedMessages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
          model: model,
          temperature: 0.6,
          num_predict: 384,
          collection: currentCollection,   // 👈 ye
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr.trim()) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "meta") {
              if (!activeConversationId && event.conversation_id) {
                setActiveConversationId(event.conversation_id);
              }
            } else if (event.type === "token") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === "ai") {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + event.content,
                  };
                }
                return updated;
              });
            } else if (event.type === "done") {
              loadConversations();
            } else if (event.type === "error") {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "ai",
                  content: `⚠️ Error: ${event.message}`,
                };
                return updated;
              });
            }
          } catch (e) {
            console.error("Parse error:", e, jsonStr);
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === "ai" && last.content === "") {
          updated[updated.length - 1] = {
            role: "ai",
            content: "⚠️ Backend se connect nahi ho paya.",
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const useSuggestion = (text) => setMessage(text);

  // ═══════════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════════
  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0d10] text-white">

      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0"
        } flex-shrink-0 overflow-hidden border-r border-white/10 bg-[#101216] transition-all duration-300`}
      >
        <div className="flex h-full w-72 flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-500/20">
              ✦
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">RajAI</h1>
              <p className="text-xs text-gray-500">Personal AI Assistant</p>
            </div>
          </div>

          {/* New Chat */}
          <div className="p-4">
            <button
              onClick={newChat}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              <span className="text-lg">＋</span>
              New Chat
            </button>
          </div>

          {/* Chat history */}
          <div className="flex-1 overflow-y-auto px-3">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Recent Chats
            </p>
            <div className="space-y-1">
              {conversations.length === 0 && (
                <p className="px-3 py-3 text-xs text-gray-600">
                  No chats yet.
                </p>
              )}
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-sm transition ${
                    activeConversationId === conv.id
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-gray-600">◌</span>
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            {/* 📚 PDF Library (Change 3) */}
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                📚 My Documents
              </p>
              <div className="max-h-52 space-y-1 overflow-y-auto">
                {pdfList.length === 0 && (
                  <p className="px-3 py-2 text-xs text-gray-600">
                    No PDFs uploaded yet
                  </p>
                )}
                {pdfList.map((pdf, i) => (
                  <div
                    key={i}
                    className="group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-white"
                    onClick={() => setViewingPdf(pdf)}
                  >
                    <span>📄</span>
                    <span className="truncate flex-1">{pdf.filename}</span>
                    <span className="text-[10px] text-gray-600">{pdf.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 font-bold">
                R
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Ranjeet</p>
                <p className="text-xs text-gray-500">Local AI</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* TOP BAR */}
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0d0f13]/90 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              ☰
            </button>
            <div>
              <h2 className="text-sm font-semibold">RajAI</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Local AI
              </div>
            </div>
          </div>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 pr-8 text-xs text-gray-300 outline-none hover:bg-white/10"
          >
            <option value="llama3.2:latest">Llama 3.2 (Best for RAG)</option>
            <option value="qwen2.5:1.5b">Qwen 2.5 (Fast)</option>
            <option value="llama3.2:1b">Llama 3.2 1B (Fastest)</option>
          </select>
        </header>

        {/* CHAT */}
        <section className="relative flex flex-1 flex-col overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-10">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-4xl ring-1 ring-white/10">
                ✦
              </div>
              <h1 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
                What can I help you with?
              </h1>
              <p className="mt-4 max-w-xl text-center text-sm leading-6 text-gray-500 md:text-base">
                Your personal AI for college, coding, DSA, assignments and learning.
              </p>

              <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => useSuggestion(item.text)}
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="mb-3 text-xl">{item.icon}</div>
                    <p className="text-sm font-semibold text-gray-200">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500 group-hover:text-gray-400">
                      {item.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-8">
              <div className="mx-auto max-w-3xl space-y-7">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                        ✦
                      </div>
                    )}

                    <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                      {/* PDF Attachment Card */}
                      {msg.attachedPdf && (
                        <div className="flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-lg">
                            📄
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-white">
                              {msg.attachedPdf.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {msg.attachedPdf.size} • {msg.attachedPdf.chunks} chunks • ✅
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                          msg.role === "user"
                            ? "rounded-br-md bg-indigo-600 text-white whitespace-pre-wrap"
                            : "rounded-bl-md border border-white/10 bg-white/5 text-gray-300"
                        }`}
                      >
                        {msg.role === "user" ? (
                          msg.content
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-[#0d0f13] prose-pre:border prose-pre:border-white/10 prose-code:text-pink-300 prose-headings:text-white prose-strong:text-white prose-a:text-indigo-400">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-700 text-sm font-bold">
                        R
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* COMPOSER */}
          <div className="border-t border-white/10 bg-[#0b0d10] px-4 pb-5 pt-4">
            <div className="mx-auto max-w-3xl">
              <div className="relative rounded-2xl border border-white/10 bg-[#15181d] shadow-2xl shadow-black/20 focus-within:border-indigo-500/40">

                {/* Attached PDF Preview */}
                {attachedPdf && (
                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-lg">
                      📄
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {attachedPdf.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {attachedPdf.size} • {attachedPdf.chunks} chunks • ✅ Ready
                      </p>
                    </div>
                    <button
                      onClick={() => setAttachedPdf(null)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-red-400"
                      title="Remove attachment"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows="2"
                  placeholder="Message RajAI..."
                  className="w-full resize-none bg-transparent px-4 py-4 pr-14 text-sm text-white placeholder-gray-600 outline-none"
                />

                <div className="flex items-center justify-between px-3 pb-3">
                  <div className="flex gap-2">
                    <label className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-gray-300">
                      {uploading ? "⏳" : "📎"}
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                    <button className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-gray-300">
                      🧠
                    </button>
                  </div>

                  <button
                    onClick={sendMessage}
                    disabled={!message.trim() || isLoading}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-gray-600">
                RajAI can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* 📄 PDF Viewer Modal (Change 4) */}
      {viewingPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingPdf(null)}
        >
          <div
            className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-[#101216]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {viewingPdf.filename}
                  </h3>
                  <p className="text-xs text-gray-500">{viewingPdf.size}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPdf(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-2xl">
              <iframe
                src={`${API}/rag/view/${viewingPdf.doc_id}`}
                className="h-full w-full"
                title={viewingPdf.filename}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
