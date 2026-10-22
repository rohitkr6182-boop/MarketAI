import { useState } from "react";
import { api } from "../api/client";

interface Msg { role: "user" | "assistant"; content: string; tools?: string[] }

export default function AIAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Ask me about any stock, market, or your paper portfolio -- e.g. \"Analyze TCS\", \"Why is TCS moving?\", \"How is my portfolio doing?\"" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await api.chat(userMsg.content);
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply, tools: res.data.tools_used }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong reaching the AI service." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      <h1 className="text-lg font-semibold">AI Market Assistant</h1>
      <div className="card flex flex-col gap-3 h-[500px] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "self-end bg-amber/20 text-amber rounded-lg px-3 py-2 max-w-[80%]" : "self-start bg-white/5 rounded-lg px-3 py-2 max-w-[80%]"}>
            <div className="text-sm">{m.content}</div>
            {m.tools && m.tools.length > 0 && (
              <div className="text-[10px] text-text2 mt-1">tools used: {m.tools.join(", ")}</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything about markets, a stock, or your portfolio…"
          className="flex-1 bg-bgCard border border-border rounded-md px-3 py-2 text-sm"
        />
        <button onClick={send} disabled={sending} className="bg-amber text-black px-4 rounded-md text-sm font-medium disabled:opacity-50">
          {sending ? "…" : "Send"}
        </button>
      </div>
      <p className="text-[10px] text-text2">
        AI responses are generated from retrieved market data, not guarantees of future performance.
      </p>
    </div>
  );
}
