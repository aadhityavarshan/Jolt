import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { FileSearch, FileUp, FileCheck2, Zap, ArrowRight } from "lucide-react";

/* ─── Typewriter hook ─── */
const phrases = [
  "Prior auth in seconds, not days",
  "Evidence-backed decisions",
  "Policy-matched coverage analysis",
  "AI-powered clinical review",
];

function useTypewriter() {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const tick = useCallback(() => {
    const current = phrases[phraseIndex];
    if (!deleting) {
      if (charIndex < current.length) {
        setCharIndex((c) => c + 1);
        setText(current.slice(0, charIndex + 1));
      } else {
        setTimeout(() => setDeleting(true), 2000);
        return;
      }
    } else {
      if (charIndex > 0) {
        setCharIndex((c) => c - 1);
        setText(current.slice(0, charIndex - 1));
      } else {
        setDeleting(false);
        setPhraseIndex((p) => (p + 1) % phrases.length);
        return;
      }
    }
  }, [charIndex, deleting, phraseIndex]);

  useEffect(() => {
    const speed = deleting ? 35 : 65;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, deleting]);

  return text;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const typewriterText = useTypewriter();

  const steps = [
    {
      icon: FileUp,
      step: "01",
      title: "Upload Records",
      description: "Import clinical notes, imaging reports, and lab results — supports PDFs and scanned documents via OCR",
    },
    {
      icon: FileSearch,
      step: "02",
      title: "AI Analyzes",
      description: "Claude cross-references extracted clinical evidence against payer-specific policy criteria using our RAG pipeline",
    },
    {
      icon: FileCheck2,
      step: "03",
      title: "Get Decision",
      description: "Get an approval likelihood score with cited evidence and matched policy criteria — 14 days reduced to seconds",
    },
  ];

  return (
    <div className="landing-sky">
      <div className="landing-bg-image" />

      {/* Content — positioned in the clear sky */}
      <div className="landing-layout">
        {/* Left column: branding */}
        <div className="landing-brand">
          <h1 className="landing-title animate-fade-in-up">
            Jolt
          </h1>
          <p className="landing-subtitle animate-fade-in-up stagger-1">
            {typewriterText}
            <span className="inline-block w-[2px] h-5 bg-white/70 ml-0.5 align-middle animate-pulse" />
          </p>
          <button
            className="landing-cta animate-fade-in-up stagger-2"
            onClick={() => navigate("/app")}
          >
            <Zap className="h-4 w-4" />
            Launch Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Right column: process staircase */}
        <div className="landing-steps">
          <p className="landing-steps-label animate-fade-in-up stagger-1">How it works</p>

          {/* Connector line behind the cards */}
          <svg className="landing-connector" viewBox="0 0 40 320" fill="none">
            <path
              d="M20 0 L20 320"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          </svg>

          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="landing-step animate-fade-in-up"
                style={{ animationDelay: `${0.3 + i * 0.2}s` }}
              >
                <div className="landing-step-number">
                  <div className="landing-step-dot">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="landing-step-content">
                  <span className="landing-step-badge">{s.step}</span>
                  <h3 className="landing-step-title">{s.title}</h3>
                  <p className="landing-step-desc">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
