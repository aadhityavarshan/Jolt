import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSearch, FileUp, FileCheck2, Zap, ArrowRight } from "lucide-react";


/* ─── SVG lightning bolt path generator ─── */
function generateBolt(startX: number, startY: number, endY: number, segments = 8): string {
  let x = startX;
  let y = startY;
  const step = (endY - startY) / segments;
  const points = [`M ${x} ${y}`];
  for (let i = 0; i < segments; i++) {
    x += (Math.random() - 0.5) * 80;
    y += step;
    points.push(`L ${x} ${y}`);
  }
  return points.join(" ");
}

/* ─── Subtle lightning bolt that fires occasionally ─── */
function LightningBolt({ delay, x }: { delay: number; x: number }) {
  const [path, setPath] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fire = () => {
      setPath(generateBolt(x, -10, 500, 8));
      setVisible(true);
      setTimeout(() => setVisible(false), 180 + Math.random() * 120);
    };
    const interval = setInterval(fire, 4000 + Math.random() * 5000);
    const initial = setTimeout(fire, delay);
    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [delay, x]);

  if (!visible) return null;
  return (
    <path
      d={path}
      fill="none"
      stroke="url(#boltGrad)"
      strokeWidth="1.5"
      filter="url(#softGlow)"
      style={{ animation: "bolt-flash 0.3s ease-out forwards" }}
    />
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileSearch,
      label: "Pre-Check",
      title: "Instant\nEvaluation",
      description: "AI-powered prior authorization decisions in seconds, not days",
    },
    {
      icon: FileUp,
      label: "Evidence",
      title: "Clinical\nMatching",
      description: "RAG-powered extraction of clinical evidence from patient records",
    },
    {
      icon: FileCheck2,
      label: "Policy",
      title: "Coverage\nAnalysis",
      description: "Automatic policy-to-criteria matching with cited references",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background lightning */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(200 98% 39%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(200 98% 39%)" stopOpacity="0" />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <LightningBolt delay={800} x={150} />
        <LightningBolt delay={2200} x={400} />
        <LightningBolt delay={3800} x={650} />
      </svg>

      {/* Subtle radial glow (matches existing body gradient) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, hsl(200 98% 39% / 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 pt-12 gap-8 w-full max-w-[1100px]">
          <div className="text-center space-y-3 animate-fade-in-up">
            <h1
              className="font-serif tracking-tight leading-none"
              style={{ fontSize: "clamp(4rem, 12vw, 8rem)" }}
            >
              <span className="text-foreground">Jolt</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Prior authorization at the speed of light
            </p>
          </div>

          {/* Feature Cards */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full animate-fade-in-up stagger-2">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card
                  key={i}
                  className="w-full sm:w-[220px] card-hover border-border/60 bg-card/70 backdrop-blur-sm"
                  style={{
                    transform: `rotate(${(i - 1) * 3}deg)`,
                  }}
                >
                  <CardContent className="pt-5 pb-5 flex flex-col items-center text-center gap-3">
                    <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
                      {f.label}
                    </Badge>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-tight whitespace-pre-line">
                      {f.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          <Button
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 animate-fade-in-up stagger-3"
            onClick={() => navigate("/app")}
          >
            <Zap className="h-4 w-4" />
            Launch Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
