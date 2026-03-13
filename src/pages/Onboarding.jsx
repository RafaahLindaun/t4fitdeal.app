import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";
const TEXT = "#0f172a";
const MUTED = "#667085";
const BG = "#f8fafc";
const CARD = "#ffffff";
const BORDER = "#e7edf3";

const TOTAL_STEPS = 3;
const SWIPE_THRESHOLD = 70;

export default function Onboarding() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [nome, setNome] = useState("");
  const [nivel, setNivel] = useState(null);
  const [freq, setFreq] = useState(null);
  const [split, setSplit] = useState(null);
  const [saving, setSaving] = useState(false);

  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef(null);
  const touchCurrentX = useRef(null);

  useEffect(() => {
    const nomeDoUsuario =
      user?.user_metadata?.nome ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "";

    setNome(nomeDoUsuario);
  }, [user]);

  function saudacao() {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }

  const greeting = useMemo(() => {
    return `${saudacao()}${nome ? ` ${nome}` : ""}, Bem-vindo ao fitdeal.`;
  }, [nome]);

  function haptic() {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {}
  }

  const niveis = [
    {
      key: "Iniciante",
      title: "Iniciante",
      subtitle: "0–3 meses de treino",
      details:
        "Ideal para construir base técnica, ganhar consistência e criar evolução segura. O foco aqui é aprender execução, melhorar coordenação, aumentar força inicial e preparar seu corpo para crescer com qualidade.",
      metrics: [
        "Mais consistência nas primeiras semanas",
        "Melhora rápida de técnica e postura",
        "Ganhos iniciais de força e massa",
      ],
    },
    {
      key: "Intermediário",
      title: "Intermediário",
      subtitle: "3–18 meses de treino",
      details:
        "Seu corpo já responde melhor ao estímulo. Aqui o treino pode ter mais volume, progressão de carga e divisão mais estratégica para acelerar hipertrofia, definição e performance.",
      metrics: [
        "Melhor resposta à progressão de carga",
        "Mais volume por grupo muscular",
        "Evolução mais visível em composição corporal",
      ],
    },
    {
      key: "Avançado",
      title: "Avançado",
      subtitle: "18+ meses de treino",
      details:
        "Nesse nível, a diferença está nos detalhes. A estrutura do treino pode explorar intensidade, técnicas avançadas, variações de estímulo e organização mais precisa para continuar evoluindo.",
      metrics: [
        "Ajustes finos de volume e intensidade",
        "Estratégia mais específica por músculo",
        "Maior foco em performance e refinamento físico",
      ],
    },
  ];

  const frequencias = [
    {
      key: 2,
      title: "2x por semana",
      subtitle: "Mais foco por sessão",
      details:
        "Boa opção para rotina apertada. O treino tende a ser mais objetivo, com sessões bem planejadas para preservar evolução mesmo com menos dias disponíveis.",
      metrics: [
        "Mais recuperação entre treinos",
        "Sessões mais completas",
        "Boa aderência para rotina corrida",
      ],
    },
    {
      key: 3,
      title: "3x por semana",
      subtitle: "Equilíbrio excelente",
      details:
        "Uma frequência muito eficiente para evolução constante. Dá para organizar treino forte, boa recuperação e progresso sólido sem sobrecarregar sua agenda.",
      metrics: [
        "Ótimo equilíbrio entre estímulo e descanso",
        "Boa base para hipertrofia e emagrecimento",
        "Rotina sustentável no longo prazo",
      ],
    },
    {
      key: 4,
      title: "4x por semana",
      subtitle: "Mais volume e consistência",
      details:
        "Permite distribuir melhor os grupos musculares e aumentar o volume total de treino, favorecendo evolução mais agressiva com recuperação ainda controlada.",
      metrics: [
        "Mais estímulo muscular semanal",
        "Divisão mais estratégica",
        "Maior potencial de evolução visual",
      ],
    },
    {
      key: 5,
      title: "5x por semana",
      subtitle: "Estrutura mais avançada",
      details:
        "Excelente para quem quer refinar o treino por grupos musculares e trabalhar com mais profundidade em cada sessão. Exige mais constância e recuperação bem organizada.",
      metrics: [
        "Maior especialização muscular",
        "Mais espaço para ajustes finos",
        "Excelente para fases de foco total",
      ],
    },
  ];

  const splits = [
    {
      key: "Full Body",
      title: "Full Body",
      subtitle: "Corpo inteiro por sessão",
      details:
        "Ideal para iniciantes e para quem treina menos dias. Você estimula os principais grupos musculares em cada treino, com alta eficiência e aprendizado rápido do movimento.",
      metrics: [
        "Ótimo para 2x e 3x por semana",
        "Mais frequência por músculo",
        "Excelente base para evolução geral",
      ],
    },
    {
      key: "ABC",
      title: "ABC",
      subtitle: "Divisão equilibrada",
      details:
        "Uma das estruturas mais versáteis para hipertrofia. Organiza bem o volume, permite foco maior em cada região do corpo e costuma encaixar muito bem em 3x ou 4x na semana.",
      metrics: [
        "Boa distribuição do esforço",
        "Foco maior por treino",
        "Muito eficiente para construção muscular",
      ],
    },
    {
      key: "ABCD",
      title: "ABCD",
      subtitle: "Mais detalhe e profundidade",
      details:
        "Divisão mais refinada para quem treina mais vezes na semana. Dá para trabalhar melhor cada grupo muscular, com mais exercícios, mais intenção e mais especificidade.",
      metrics: [
        "Mais volume por músculo",
        "Melhor detalhamento do treino",
        "Ótima opção para quem já tem base",
      ],
    },
  ];

  const progressWidth = `${((step + 1) / TOTAL_STEPS) * 100}%`;

  function canContinueCurrentStep() {
    if (step === 0) return !!nivel;
    if (step === 1) return !!freq;
    if (step === 2) return !!split;
    return false;
  }

  function next() {
    if (!canContinueCurrentStep()) return;
    if (step < TOTAL_STEPS - 1) {
      haptic();
      setStep((s) => s + 1);
      setDragX(0);
    }
  }

  function prev() {
    if (step > 0) {
      haptic();
      setStep((s) => s - 1);
      setDragX(0);
    }
  }

  function selectNivel(value) {
    haptic();
    setNivel(value);
  }

  function selectFreq(value) {
    haptic();
    setFreq(value);
  }

  function selectSplit(value) {
    haptic();
    setSplit(value);
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }

  function handleTouchMove(e) {
    if (touchStartX.current == null) return;
    touchCurrentX.current = e.touches[0].clientX;
    const delta = touchCurrentX.current - touchStartX.current;
    setDragX(delta);
  }

  function handleTouchEnd() {
    if (touchStartX.current == null || touchCurrentX.current == null) {
      setDragX(0);
      return;
    }

    const delta = touchCurrentX.current - touchStartX.current;

    if (delta > SWIPE_THRESHOLD) {
      prev();
    } else if (delta < -SWIPE_THRESHOLD) {
      next();
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
    setDragX(0);
  }

  async function concluir() {
    if (!split || saving) return;

    try {
      setSaving(true);
      haptic();

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser?.id) {
        setSaving(false);
        return;
      }

      await supabase
        .from("profiles")
        .upsert(
          {
            id: authUser.id,
            email: authUser.email || "",
            nome:
              authUser.user_metadata?.nome ||
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              nome ||
              "",
            provider: authUser.app_metadata?.provider || "email",
          },
          { onConflict: "id" }
        );

      const { error } = await supabase
        .from("profiles")
        .update({
          nivel,
          frequencia: freq,
          split,
          onboarded: true,
        })
        .eq("id", authUser.id);

      if (error) {
        console.error("Erro ao concluir onboarding:", error);
        setSaving(false);
        return;
      }

      nav("/dashboard", { replace: true });
    } catch (error) {
      console.error("Erro ao concluir onboarding:", error);
      setSaving(false);
    }
  }

  function OptionCard({ item, selected, onSelect }) {
    return (
      <button
        type="button"
        onClick={onSelect}
        style={{
          ...S.optionCard,
          ...(selected ? S.optionCardActive : null),
          transform: selected ? "scale(1)" : "scale(0.995)",
        }}
      >
        <div style={S.optionTopRow}>
          <div>
            <div style={S.optionTitle}>{item.title}</div>
            {item.subtitle ? <div style={S.optionSubtitle}>{item.subtitle}</div> : null}
          </div>

          <div
            style={{
              ...S.radio,
              ...(selected ? S.radioActive : null),
            }}
          >
            <div
              style={{
                ...S.radioInner,
                opacity: selected ? 1 : 0,
                transform: selected ? "scale(1)" : "scale(0.7)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            ...S.expandWrap,
            maxHeight: selected ? 260 : 0,
            opacity: selected ? 1 : 0,
            marginTop: selected ? 14 : 0,
          }}
        >
          <div style={S.expandText}>{item.details}</div>

          <div style={S.metricsWrap}>
            {item.metrics.map((metric) => (
              <div key={metric} style={S.metricPill}>
                {metric}
              </div>
            ))}
          </div>
        </div>
      </button>
    );
  }

  function renderStep() {
    if (step === 0) {
      return (
        <>
          <div style={S.questionBalloon}>
            <div style={S.stepLabel}>Etapa 1 de 3</div>
            <div style={S.questionTitle}>Qual seu nível atual de treino {nome || "?"}</div>
            <div style={S.questionText}>
              Isso define o volume, a intensidade e a complexidade ideal para sua evolução.
            </div>
          </div>

          <div style={S.optionsStack}>
            {niveis.map((item) => (
              <OptionCard
                key={item.key}
                item={item}
                selected={nivel === item.key}
                onSelect={() => selectNivel(item.key)}
              />
            ))}
          </div>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <div style={S.questionBalloon}>
            <div style={S.stepLabel}>Etapa 2 de 3</div>
            <div style={S.questionTitle}>Quantas vezes por semana você consegue treinar?</div>
            <div style={S.questionText}>
              A frequência muda totalmente a melhor estratégia para seu treino funcionar de verdade.
            </div>
          </div>

          <div style={S.optionsStack}>
            {frequencias.map((item) => (
              <OptionCard
                key={item.key}
                item={item}
                selected={freq === item.key}
                onSelect={() => selectFreq(item.key)}
              />
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <div style={S.questionBalloon}>
          <div style={S.stepLabel}>Etapa 3 de 3</div>
          <div style={S.questionTitle}>Como você quer estruturar seu treino {nome || ""}?</div>
          <div style={S.questionText}>
            A divisão certa melhora recuperação, constância e acelera seus ganhos.
          </div>
        </div>

        <div style={S.optionsStack}>
          {splits.map((item) => (
            <OptionCard
              key={item.key}
              item={item}
              selected={split === item.key}
              onSelect={() => selectSplit(item.key)}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.safeWrap}>
        <div style={S.brandRow}>
          <div style={S.brand}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>
        </div>

        <div style={S.hero}>
          <div style={S.greeting}>{greeting}</div>
          <div style={S.heroSub}>
            Vamos definir uma base inteligente para o seu treino render mais, evoluir melhor e
            encaixar de verdade na sua rotina.
          </div>
        </div>

        <div style={S.progressOuter}>
          <div style={S.progressTrack}>
            <div style={{ ...S.progressFill, width: progressWidth }} />
          </div>
        </div>

        <div
          style={{
            ...S.sliderViewport,
            cursor: dragX !== 0 ? "grabbing" : "grab",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            style={{
              ...S.sliderTrack,
              width: `${TOTAL_STEPS * 100}%`,
              transform: `translateX(calc(-${step * (100 / TOTAL_STEPS)}% + ${dragX}px))`,
              transition: dragX === 0 ? "transform 260ms cubic-bezier(.22,1,.36,1)" : "none",
            }}
          >
            <div style={S.slide}>{step === 0 ? renderStep() : null}</div>
            <div style={S.slide}>{step === 1 ? renderStep() : null}</div>
            <div style={S.slide}>{step === 2 ? renderStep() : null}</div>
          </div>
        </div>

        <div style={S.bottomBar}>
          <button
            type="button"
            onClick={prev}
            style={{
              ...S.secondaryButton,
              opacity: step === 0 ? 0.45 : 1,
            }}
            disabled={step === 0}
          >
            Voltar
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={next}
              style={{
                ...S.primaryButton,
                opacity: canContinueCurrentStep() ? 1 : 0.55,
              }}
              disabled={!canContinueCurrentStep()}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={concluir}
              style={{
                ...S.primaryButton,
                opacity: split && !saving ? 1 : 0.55,
              }}
              disabled={!split || saving}
            >
              {saving ? "Finalizando..." : "Concluir"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: BG,
    color: TEXT,
  },

  safeWrap: {
    minHeight: "100vh",
    maxWidth: 560,
    margin: "0 auto",
    padding: "20px 18px 28px",
    display: "flex",
    flexDirection: "column",
  },

  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 18,
  },

  brand: {
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: -1.2,
    color: TEXT,
  },

  hero: {
    marginBottom: 22,
  },

  greeting: {
    fontSize: 34,
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: -1.3,
    color: TEXT,
    marginBottom: 12,
  },

  heroSub: {
    fontSize: 15,
    lineHeight: 1.5,
    color: MUTED,
    maxWidth: 520,
  },

  progressOuter: {
    marginBottom: 18,
  },

  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e9eff5",
    overflow: "hidden",
    boxShadow: "inset 0 1px 1px rgba(15,23,42,0.05)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: `linear-gradient(90deg, ${ORANGE} 0%, #ff8c3a 100%)`,
    transition: "width 260ms cubic-bezier(.22,1,.36,1)",
  },

  sliderViewport: {
    position: "relative",
    overflow: "hidden",
    flex: 1,
    WebkitUserSelect: "none",
    userSelect: "none",
  },

  sliderTrack: {
    display: "flex",
    height: "100%",
    willChange: "transform",
  },

  slide: {
    width: `${100 / TOTAL_STEPS}%`,
    flexShrink: 0,
    paddingRight: 2,
  },

  questionBalloon: {
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    border: `1px solid ${BORDER}`,
    borderRadius: 28,
    padding: "22px 18px",
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
    marginBottom: 16,
  },

  stepLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
    color: ORANGE,
    marginBottom: 10,
  },

  questionTitle: {
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: -0.9,
    color: TEXT,
    marginBottom: 10,
  },

  questionText: {
    fontSize: 14,
    lineHeight: 1.5,
    color: MUTED,
  },

  optionsStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingBottom: 10,
  },

  optionCard: {
    width: "100%",
    textAlign: "left",
    border: `1px solid ${BORDER}`,
    background: CARD,
    borderRadius: 24,
    padding: "18px 16px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    transition:
      "border-color 180ms ease, background 180ms ease, transform 180ms ease, box-shadow 180ms ease",
    cursor: "pointer",
  },

  optionCardActive: {
    borderColor: "rgba(255,106,0,0.35)",
    background: "#fff7f1",
    boxShadow: "0 10px 28px rgba(255,106,0,0.10)",
  },

  optionTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  optionTitle: {
    fontSize: 20,
    lineHeight: 1.15,
    fontWeight: 750,
    letterSpacing: -0.5,
    color: TEXT,
    marginBottom: 4,
  },

  optionSubtitle: {
    fontSize: 13.5,
    lineHeight: 1.4,
    color: MUTED,
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    border: "1.5px solid #d1dae4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 160ms ease",
    marginTop: 1,
    background: "#fff",
  },

  radioActive: {
    borderColor: ORANGE,
    background: "#fff2e8",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 999,
    background: ORANGE,
    transition: "all 160ms ease",
  },

  expandWrap: {
    overflow: "hidden",
    transition: "all 220ms cubic-bezier(.22,1,.36,1)",
  },

  expandText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#425466",
  },

  metricsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  metricPill: {
    padding: "9px 12px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #e8edf3",
    fontSize: 12.5,
    lineHeight: 1.2,
    color: TEXT,
  },

  bottomBar: {
    display: "grid",
    gridTemplateColumns: "112px 1fr",
    gap: 12,
    paddingTop: 14,
    marginTop: "auto",
    background: BG,
  },

  secondaryButton: {
    height: 56,
    borderRadius: 18,
    border: "1px solid #dde6ee",
    background: "#fff",
    color: TEXT,
    fontSize: 16,
    fontWeight: 700,
  },

  primaryButton: {
    height: 56,
    borderRadius: 18,
    border: "none",
    background: TEXT,
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: -0.2,
    boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
  },
};
