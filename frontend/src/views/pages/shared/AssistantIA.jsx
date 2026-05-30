import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Brain,
  ClipboardList,
  Download,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { jsPDF } from "jspdf";

import { api } from "@/controllers/api/api";

const STORAGE_KEY = "assistant-ia-history";
const MAX_HISTORY_ITEMS = 5;

const ANALYSIS_OPTIONS = [
  { value: "accident", label: "Accident de travail" },
  { value: "symptomes", label: "Symptomes medicaux" },
  { value: "rapport_hsee", label: "Rapport HSEE" },
  { value: "general", label: "General" },
];

const QUICK_SUGGESTIONS = [
  {
    label: "Accident",
    type: "accident",
    description:
      "Brulure legere dans atelier cablage apres contact avec une surface chaude. Rougeur locale et douleur moderee.",
  },
  {
    label: "Symptomes",
    type: "symptomes",
    description:
      "Collaborateur avec maux de tete, fatigue importante et vertiges depuis ce matin pendant le poste.",
  },
  {
    label: "Rapport HSEE",
    type: "rapport_hsee",
    description:
      "Observation HSEE sur une zone de production avec non-port partiel des EPI et circulation difficile autour des machines.",
  },
  {
    label: "Produit chimique",
    type: "accident",
    description:
      "Projection probable de produit chimique sur la main lors de la manipulation d'un bidon de nettoyage industriel.",
  },
  {
    label: "Chute",
    type: "accident",
    description:
      "Chute de plain-pied pres de la ligne de production apres glissade sur zone humide. Douleur au poignet et au genou.",
  },
  {
    label: "Malaise",
    type: "symptomes",
    description:
      "Malaise avec sensation de vertige et faiblesse generale pendant le travail, sans perte de connaissance.",
  },
];

const SOURCE_STYLES = {
  gemini: {
    label: "Gemini AI",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  fallback_local: {
    label: "Fallback local",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  error: {
    label: "Erreur",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
};

const SECTION_CONFIG = {
  gravite: {
    title: "Gravite",
    icon: TriangleAlert,
    tone: "border-rose-100 bg-rose-50/70 text-rose-700",
  },
  risques: {
    title: "Risques",
    icon: ShieldAlert,
    tone: "border-amber-100 bg-amber-50/70 text-amber-700",
  },
  recommandations_medicales: {
    title: "Recommandations medicales",
    icon: Stethoscope,
    tone: "border-sky-100 bg-sky-50/70 text-sky-700",
  },
  actions_hsee: {
    title: "Actions HSEE",
    icon: ClipboardList,
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  },
};

function normalizeAssistantResponse(payload) {
  const rawAnalysis = payload?.analysis;
  const rawSource = payload?.source;

  if (typeof rawAnalysis === "string") {
    return {
      analysis: rawAnalysis,
      source: typeof rawSource === "string" ? rawSource : "",
    };
  }

  if (rawAnalysis && typeof rawAnalysis === "object") {
    return {
      analysis:
        typeof rawAnalysis.analysis === "string"
          ? rawAnalysis.analysis
          : JSON.stringify(rawAnalysis, null, 2),
      source:
        typeof rawAnalysis.source === "string"
          ? rawAnalysis.source
          : typeof rawSource === "string"
          ? rawSource
          : "",
    };
  }

  return {
    analysis: "",
    source: typeof rawSource === "string" ? rawSource : "",
  };
}

function safeParseHistory() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatTimestamp(value) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function parseAnalysisSections(analysis) {
  const normalized = (analysis || "").replace(/\r/g, "").trim();
  const lines = normalized.split("\n");
  const sections = [];
  let currentSection = null;

  const resolveKey = (line) => {
    const value = line.trim().toLowerCase();
    if (value === "gravite") return "gravite";
    if (value === "risques") return "risques";
    if (value === "recommandations medicales") return "recommandations_medicales";
    if (value === "actions hsee") return "actions_hsee";
    return null;
  };

  lines.forEach((line) => {
    const key = resolveKey(line);
    if (key) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { key, items: [] };
      return;
    }

    if (!currentSection) {
      return;
    }

    const cleanedLine = line.replace(/^\-\s*/, "").trim();
    if (cleanedLine) {
      currentSection.items.push(cleanedLine);
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function exportAnalysisToPdf(entry) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  const writeBlock = (title, content) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const textLines = doc.splitTextToSize(content || "-", pageWidth - margin * 2);
    doc.text(textLines, margin, y);
    y += textLines.length * 4.5 + 5;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Assistant IA Medical Intelligent", margin, y);
  y += 8;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  writeBlock("Type d'analyse", entry.typeLabel);
  writeBlock("Description", entry.description);
  writeBlock("Resultat IA", entry.analysis);
  writeBlock("Source IA", entry.sourceLabel);
  writeBlock("Date et heure", formatTimestamp(entry.createdAt));

  doc.save(`assistant-ia-${entry.id}.pdf`);
}

function SourceBadge({ source }) {
  const sourceStyle = SOURCE_STYLES[source] || SOURCE_STYLES.error;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${sourceStyle.className}`}
    >
      {sourceStyle.label}
    </span>
  );
}

function StatMiniCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold leading-none text-slate-900">{value}</p>
    </div>
  );
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  const sections = !isUser ? parseAnalysisSections(message.content) : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`flex max-w-[88%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
          {!isUser ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white">
              <Bot className="h-3 w-3" />
            </span>
          ) : null}
          <span>{isUser ? "Vous" : "Assistant IA"}</span>
          <span>{formatTimestamp(message.createdAt)}</span>
        </div>

        <div
          className={[
            "rounded-2xl border px-3 py-2 shadow-sm",
            isUser
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[13px] leading-5">{message.content}</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-900">Analyse intelligente</p>
                <SourceBadge source={message.source || "error"} />
              </div>

              {sections.length ? (
                <div className="grid gap-2">
                  {sections.map((section) => {
                    const config = SECTION_CONFIG[section.key];
                    const Icon = config.icon;

                    return (
                      <section key={`${message.id}-${section.key}`} className={`rounded-2xl border p-2.5 ${config.tone}`}>
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-current">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <h3 className="text-xs font-semibold">{config.title}</h3>
                        </div>

                        <ul className="space-y-1 text-[12px] leading-5 text-slate-700">
                          {section.items.map((item, index) => (
                            <li key={`${section.key}-${index}`} className="flex gap-2">
                              <span className="mt-2 h-1 w-1 rounded-full bg-current opacity-70" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-sans text-[12px] leading-5 text-slate-700">
                  {message.content}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryCard({ item, onReload }) {
  return (
    <button
      type="button"
      onClick={() => onReload(item)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:bg-slate-50"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-500">{item.typeLabel}</span>
        <SourceBadge source={item.source || "error"} />
      </div>
      <p className="line-clamp-2 text-[12px] font-medium leading-5 text-slate-800">{item.description}</p>
      <p className="mt-1 text-[10px] text-slate-400">{formatTimestamp(item.createdAt)}</p>
    </button>
  );
}

export default function AssistantIA() {
  const [type, setType] = useState("accident");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState(() => safeParseHistory());
  const conversationEndRef = useRef(null);

  const typeLabelMap = useMemo(
    () => Object.fromEntries(ANALYSIS_OPTIONS.map((option) => [option.value, option.label])),
    []
  );

  const placeholder = useMemo(() => {
    switch (type) {
      case "symptomes":
        return "Decrivez les symptomes et le contexte clinique...";
      case "rapport_hsee":
        return "Decrivez le rapport HSEE et la situation observee...";
      case "general":
        return "Decrivez votre besoin ou votre question...";
      default:
        return "Decrivez l'accident, les lesions et les circonstances...";
    }
  }, [type]);

  const latestHistoryEntry = history[0] || null;
  const lastAssistantMessage = [...messages].reverse().find(
    (message) => message.role === "assistant" && message.source !== "error"
  );

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const persistHistoryEntry = (entry) => {
    setHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, MAX_HISTORY_ITEMS));
  };

  const pushMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setError("La description est obligatoire.");
      return;
    }

    const now = new Date().toISOString();
    pushMessage({
      id: `${now}-user`,
      role: "user",
      content: trimmedDescription,
      createdAt: now,
    });

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/ai/analyse/", {
        description: trimmedDescription,
        type,
      });

      const normalizedResponse = normalizeAssistantResponse(response?.data || {});
      const assistantMessage = {
        id: `${now}-assistant`,
        role: "assistant",
        content: normalizedResponse.analysis || "Aucune analyse disponible.",
        source: normalizedResponse.source || "gemini",
        createdAt: new Date().toISOString(),
      };

      pushMessage(assistantMessage);

      persistHistoryEntry({
        id: `${Date.now()}`,
        type,
        typeLabel: typeLabelMap[type] || type,
        description: trimmedDescription,
        analysis: assistantMessage.content,
        source: assistantMessage.source,
        sourceLabel: (SOURCE_STYLES[assistantMessage.source] || SOURCE_STYLES.error).label,
        createdAt: assistantMessage.createdAt,
      });

      setDescription("");
    } catch (err) {
      console.error(err);
      const responseData = err?.response?.data || {};
      const details = responseData?.details;
      const message = responseData?.error;
      const errorText = details || message || "Le service IA est indisponible pour le moment.";

      setError(errorText);
      pushMessage({
        id: `${Date.now()}-error`,
        role: "assistant",
        content: errorText,
        source: "error",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setType(suggestion.type);
    setDescription(suggestion.description);
    setError("");
  };

  const handleReloadHistoryItem = (item) => {
    setType(item.type);
    setDescription(item.description);
    setError("");
  };

  const handleClearHistory = () => {
    setHistory([]);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="space-y-2">
      <section className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Brain className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Assistant IA</p>
              <h1 className="mt-0.5 text-[22px] font-bold tracking-tight text-slate-900">
                Assistant IA Medical Intelligent
              </h1>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Analyse medicale et HSEE avec rendu intelligent et secours local.
              </p>
            </div>
          </div>

          <div className="hidden gap-2 md:grid md:grid-cols-3 md:w-[270px]">
            <StatMiniCard label="Analyses" value={messages.filter((item) => item.role === "assistant").length} />
            <StatMiniCard label="Historique" value={history.length} />
            <StatMiniCard
              label="Source"
              value={lastAssistantMessage ? (SOURCE_STYLES[lastAssistantMessage.source] || SOURCE_STYLES.error).label : "-"}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-2 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-2">
          <section className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-slate-900">Nouvelle analyse</h2>
              <p className="text-[10px] text-slate-500">Formulaire compact et accessible sans scroll global.</p>
            </div>

            <form className="space-y-2" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Type d'analyse</label>
                <select
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                >
                  {ANALYSIS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Suggestions rapides</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion.label}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={7}
                  placeholder={placeholder}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span>{loading ? "Analyse en cours..." : "Analyser"}</span>
                </button>

                <button
                  type="button"
                  disabled={!latestHistoryEntry}
                  onClick={() => (latestHistoryEntry ? exportAnalysisToPdf(latestHistoryEntry) : null)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>Exporter PDF</span>
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Historique local</h2>
                <p className="text-[10px] text-slate-500">5 dernieres analyses</p>
              </div>

              <button
                type="button"
                onClick={handleClearHistory}
                disabled={!history.length}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                <span>Vider</span>
              </button>
            </div>

            <div className="max-h-[180px] space-y-2 overflow-y-auto pr-1">
              {history.length ? (
                history.map((item) => (
                  <HistoryCard key={item.id} item={item} onReload={handleReloadHistoryItem} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center text-[12px] text-slate-500">
                  Aucun historique pour le moment.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <MessageSquareText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Conversation IA</h2>
                <p className="text-[10px] text-slate-500">Resultat et historique de session</p>
              </div>
            </div>

            {lastAssistantMessage ? <SourceBadge source={lastAssistantMessage.source || "error"} /> : null}
          </div>

          <div className="h-[calc(100vh-15.5rem)] min-h-[420px] max-h-[620px] overflow-y-auto rounded-2xl bg-slate-50 p-3">
            <div className="space-y-3">
              {!messages.length && !loading ? (
                <div className="flex min-h-[380px] items-center justify-center">
                  <div className="max-w-sm rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900">Pret a analyser</h3>
                    <p className="mt-1 text-[12px] leading-5 text-slate-500">
                      Lancez une analyse pour afficher la reponse IA dans un format conversationnel compact.
                    </p>
                  </div>
                </div>
              ) : null}

              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}

              {loading ? (
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-[88%] rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <Brain className="h-4 w-4 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">Analyse intelligente en cours...</p>
                        <p className="text-[10px] text-slate-500">Generation de la reponse medicale et HSEE.</p>
                      </div>
                      <Loader2 className="ml-auto h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={conversationEndRef} />
            </div>
          </div>

          <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-3.5 w-3.5 text-slate-500" />
              <p className="text-[11px] text-slate-600">
                Utilisez les suggestions rapides, puis exportez la derniere analyse en PDF si besoin.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

