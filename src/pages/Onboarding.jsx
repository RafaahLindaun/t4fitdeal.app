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
const SWIPE_THRESHOLD = 72;

export default function Onboarding() {
  const nav = useNavigate();
  const { user } = useAuth();

  const sliderRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const draggingRef = useRef(false);

  const [nome, setNome] = useState("");
  const [step, setStep] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [foco, setFoco] = useState(null);
  const [nivelKey, setNivelKey] = useState(null);
  const [dias, setDias] = useState(null);

  useEffect(() => {
    const nomeDoUsuario =
      user?.user_metadata?.nome ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "";

    setNome(nomeDoUsuario);
  }, [user]);

  function haptic() {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {}
  }

  function saudacao() {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }

  const step1Options = [
    {
      key: "hipertrofia",
      title: "Hipertrofia",
      subtitle: "Mais volume, mais construção muscular",
      details:
        "Seu treino vai priorizar estímulo para ganho de massa, progressão de carga, execução forte e constância. A ênfase aqui é crescer com estrutura.",
      metrics: [
        "Mais foco em massa muscular",
        "Progressão de carga",
        "Maior ênfase estética",
      ],
      objetivo: "Hipertrofia",
    },
    {
      key: "emagrecimento",
      title: "Emagrecimento",
      subtitle: "Mais gasto, mais constância, mais controle",
      details:
        "Seu treino tende a usar uma estrutura mais dinâmica, boa densidade de trabalho e constância semanal para acelerar gasto calórico sem perder qualidade muscular.",
      metrics: [
        "Mais gasto calórico",
        "Rotina mais dinâmica",
        "Melhor aderência semanal",
      ],
      objetivo: "Emagrecimento",
    },
    {
      key: "performance",
      title: "Performance",
      subtitle: "Força, condicionamento e evolução atlética",
      details:
        "A estrutura privilegia desempenho, eficiência e evolução física geral. O treino passa a mirar força, resistência e resposta atlética com mais precisão.",
      metrics: [
        "Mais força e rendimento",
        "Melhora de condicionamento",
        "Estrutura mais atlética",
      ],
      objetivo: "Performance",
    },
  ];

  const step2Options = [
    {
      key: "iniciante",
      title: "Iniciante",
      subtitle: "Estrutura sugerida: Full Body",
      details:
        "Nesse nível, a melhor estratégia é consolidar base técnica, frequência por músculo e consistência. Full Body costuma entregar mais resultado com menos complexidade.",
      metrics: [
        "Base técnica mais sólida",
        "Mais eficiência por sessão",
        "Melhor adaptação inicial",
      ],
      nivel: "Iniciante",
      split: "Full Body",
      intensidade: "moderada",
    },
    {
      key: "intermediario",
      title: "Intermediário",
      subtitle: "Estrutura sugerida: ABC",
      details:
        "Aqui já vale usar uma divisão mais inteligente para aumentar volume, distribuir melhor os estímulos e acelerar evolução visual sem perder recuperação.",
      metrics: [
        "Mais volume por grupo",
        "Divisão equilibrada",
        "Ótimo para evolução muscular",
      ],
      nivel: "Intermediário",
      split: "ABC",
      intensidade: "moderada",
    },
    {
      key: "avancado",
      title: "Avançado",
      subtitle: "Estrutura sugerida: ABCD",
      details:
        "Seu treino pode trabalhar com mais profundidade e especialização. A divisão ABCD favorece refinamento muscular, foco por sessão e maior detalhamento do estímulo.",
      metrics: [
        "Mais especificidade",
        "Maior volume por músculo",
        "Estrutura mais avançada",
      ],
      nivel: "Avançado",
      split: "ABCD",
      intensidade: "alta",
    },
  ];

  const step3Options = [
    {
      key: 2,
      title: "2x por semana",
      subtitle: "Treino mais enxuto e estratégico",
      details:
        "Boa opção para rotina apertada. O app organiza sessões mais objetivas para preservar resultado e encaixar melhor no seu dia a dia.",
      metrics: [
        "Boa aderência",
        "Mais recuperação",
        "Treino objetivo",
      ],
      frequencia: 2,
    },
    {
      key: 3,
      title: "3x por semana",
      subtitle: "Equilíbrio forte entre resultado e rotina",
      details:
        "Uma das frequências mais eficientes para evoluir com consistência. Permite treino bem distribuído, recuperação sólida e progresso contínuo.",
      metrics: [
        "Equilíbrio ideal",
        "Boa recuperação",
        "Ótimo custo-benefício semanal",
      ],
      frequencia: 3,
    },
    {
      key: 4,
      title: "4x por semana",
      subtitle: "Mais estímulo e mais volume",
      details:
        "Excelente para quem quer acelerar evolução e suportar uma rotina de treino mais presente. Dá mais espaço para dividir melhor os grupos musculares.",
      metrics: [
        "Mais volume semanal",
        "Mais estímulo muscular",
        "Maior potencial visual",
      ],
      frequencia: 4,
    },
    {
      key: 5,
      title: "5x por semana",
      subtitle: "Foco total e estrutura mais forte",
      details:
        "Ideal para uma rotina mais dedicada. O treino consegue ficar mais refinado e mais profundo, com foco alto em evolução e organização muscular.",
      metrics: [
        "Treino mais completo",
        "Mais espaço para especialização",
        "Estrutura mais agressiva",
      ],
      frequencia: 5,
    },
  ];

  const selectedFoco = useMemo(
    () => step1Options.find((item) => item.key === foco) || null,
    [foco]
  );

  const selectedNivel = useMemo(
    () => step2Options.find((item) => item.key === nivelKey) || null,
    [nivelKey]
  );

  const selectedDias = useMemo(
    () => step3Options.find((item) => item.key === dias) || null,
    [dias]
  );

  const progressWidth = `${((step + 1) / TOTAL_STEPS) * 100}%`;

  function canContinue() {
    if (step === 0) return !!selectedFoco;
    if (step === 1) return !!selectedNivel;
    if (step === 2) return !!selectedDias;
    return false;
  }

  function goNext() {
    if (!canContinue() || animating) return;
    if (step < TOTAL_STEPS - 1) {
      haptic();
      setAnimating(true);
      setStep((prev) => prev + 1);
      setDragPx(0);
      setTimeout(() => setAnimating(false), 260);
    }
  }

  function goPrev() {
    if (animating) return;
    if (step > 0) {
      haptic();
      setAnimating(true);
      setStep((prev) => prev - 1);
      setDragPx(0);
      setTimeout(() => setAnimating(false), 260);
    }
  }

  function handleTouchStart(e) {
    if (!sliderRef.current || animating) return;
    draggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
  }

  function handleTouchMove(e) {
    if (!draggingRef.current || !sliderRef.current) return;
    currentXRef.current = e.touches[0].clientX;

    let delta = currentXRef.current - startXRef.current;

    if (step === 0 && delta > 0) delta *= 0.35;
    if (step === TOTAL_STEPS - 1 && delta < 0) delta *= 0.35;

    setDragPx(delta);
  }

  function handleTouchEnd() {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    const delta = currentXRef.current - startXRef.current;

    if (delta < -SWIPE_THRESHOLD && canContinue() && step < TOTAL_STEPS - 1) {
      goNext();
    } else if (delta > SWIPE_THRESHOLD && step > 0) {
      goPrev();
    } else {
      setDragPx(0);
    }
  }

  async function concluir() {
    if (!selectedFoco || !selectedNivel || !selectedDias || saving) return;

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

      const payload = {
        id: authUser.id,
        email: authUser.email || "",
        nome:
          authUser.user_metadata?.nome ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          nome ||
          "",
        objetivo: selectedFoco.objetivo,
        nivel: selectedNivel.nivel,
        split: selectedNivel.split,
        intensidade: selectedNivel.intensidade,
        frequencia: selectedDias.frequencia,
        onboarded: true,
        provider: authUser.app_metadata?.provider || "email",
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

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

  function OptionCard({ item, selected, onPress }) {
    return (
      <button
        type="button"
        onClick={() => {
          haptic();
          onPress();
        }}
        style={{
          ...S.optionCard,
          ...(selected ? S.optionCardActive : null),
        }}
      >
        <div style={S.optionHeader}>
          <div>
            <div style={S.optionTitle}>{item.title}</div>
            {item.subtitle ? <div style={S.optionSubtitle}>{item.subtitle}</div> : null}
          </div>

          <div style={{ ...S.indicator, ...(selected ? S.indicatorActive : null) }}>
            <div
              style={{
                ...S.indicatorInner,
                opacity: selected ? 1 : 0,
                transform: selected ? "scale(1)" : "scale(0.72)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            ...S.detailsWrap,
            maxHeight: selected ? 220 : 0,
            opacity: selected ? 1 : 0,
            marginTop: selected ? 14 : 0,
          }}
        >
          <div style={S.detailsText}>{item.details}</div>

          <div style={S.pillsRow}>
            {item.metrics.map((metric) => (
              <div key={metric} style={S.pill}>
                {metric}
              </div>
            ))}
          </div>
        </div>
      </button>
    );
  }

  function renderQuestionBlock() {
    if (step === 0) {
      return (
        <>
          <div style={S.questionBalloon}>
            <div style={S.stepText}>Etapa 1 de 3</div>
            <div style={S.questionTitle}>
              {saudacao()} {nome || ""}, qual o seu foco principal?
            </div>
            <div style={S.questionSubtitle}>
              A resposta aqui muda a ênfase do treino dentro do app.
            </div>
          </div>

          <div style={S.cardsCol}>
            {step1Options.map((item) => (
              <OptionCard
                key={item.key}
                item={item}
                selected={foco === item.key}
                onPress={() => setFoco(item.key)}
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
            <div style={S.stepText}>Etapa 2 de 3</div>
            <div style={S.questionTitle}>
              Qual seu nível e a melhor estrutura para você {nome || ""}?
            </div>
            <div style={S.questionSubtitle}>
              Aqui o app define o tipo de divisão e a intensidade base do seu treino.
            </div>
          </div>

          <div style={S.cardsCol}>
            {step2Options.map((item) => (
              <OptionCard
                key={item.key}
                item={item}
                selected={nivelKey === item.key}
                onPress={() => setNivelKey(item.key)}
              />
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <div style={S.questionBalloon}>
          <div style={S.stepText}>Etapa 3 de 3</div>
          <div style={S.questionTitle}>
            Quantos dias por semana você consegue treinar?
          </div>
          <div style={S.questionSubtitle}>
            Isso ajusta a frequência real do seu treino dentro do FitDeal.
          </div>
        </div>

        <div style={S.cardsCol}>
          {step3Options.map((item) => (
            <OptionCard
              key={item.key}
              item={item}
              selected={dias === item.key}
              onPress={() => setDias(item.key)}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.brand}>
          fitdeal<span style={{ color: ORANGE }}>.</span>
        </div>

        <div style={S.progressBlock}>
          <div style={S.progressTrack}>
            <div style={{ ...S.progressFill, width: progressWidth }} />
          </div>
        </div>

        <div
          ref={sliderRef}
          style={S.viewport}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            style={{
              ...S.track,
              width: `${TOTAL_STEPS * 100}%`,
              transform: `translateX(calc(-${step * (100 / TOTAL_STEPS)}% + ${dragPx}px))`,
              transition: draggingRef.current ? "none" : "transform 260ms cubic-bezier(.22,1,.36,1)",
            }}
          >
            <div style={S.slide}>{step === 0 ? renderQuestionBlock() : null}</div>
            <div style={S.slide}>{step === 1 ? renderQuestionBlock() : null}</div>
            <div style={S.slide}>{step === 2 ? renderQuestionBlock() : null}</div>
          </div>
        </div>

        <div style={S.bottomBar}>
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 0}
            style={{
              ...S.secondaryBtn,
              opacity: step === 0 ? 0.45 : 1,
            }}
          >
            Voltar
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue()}
              style={{
                ...S.primaryBtn,
                opacity: canContinue() ? 1 : 0.55,
              }}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={concluir}
              disabled={!canContinue() || saving}
              style={{
                ...S.primaryBtn,
                opacity: canContinue() && !saving ? 1 : 0.55,
              }}
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

  wrap: {
    minHeight: "100vh",
    maxWidth: 560,
    margin: "0 auto",
    padding: "24px 18px 28px",
    display: "flex",
    flexDirection: "column",
  },

  brand: {
    fontSize: 32,
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: -1.3,
    marginBottom: 18,
  },

  progressBlock: {
    marginBottom: 18,
  },

  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e9eff5",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    background: `linear-gradient(90deg, ${ORANGE} 0%, #ff8f41 100%)`,
    transition: "width 260ms cubic-bezier(.22,1,.36,1)",
  },

  viewport: {
    position: "relative",
    overflow: "hidden",
    flex: 1,
    WebkitUserSelect: "none",
    userSelect: "none",
    touchAction: "pan-y",
  },

  track: {
    display: "flex",
    height: "100%",
    willChange: "transform",
  },

  slide: {
    width: `${100 / TOTAL_STEPS}%`,
    flexShrink: 0,
  },

  questionBalloon: {
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    border: `1px solid ${BORDER}`,
    borderRadius: 30,
    padding: "22px 18px",
    boxShadow: "0 14px 32px rgba(15,23,42,0.06)",
    marginBottom: 16,
  },

  stepText: {
    fontSize: 12.5,
    fontWeight: 800,
    letterSpacing: 0.2,
    color: ORANGE,
    marginBottom: 12,
  },

  questionTitle: {
    fontSize: 25,
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: -0.8,
    marginBottom: 10,
  },

  questionSubtitle: {
    fontSize: 14,
    lineHeight: 1.5,
    color: MUTED,
  },

  cardsCol: {
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
      "border-color 170ms ease, background 170ms ease, box-shadow 170ms ease, transform 170ms ease",
  },

  optionCardActive: {
    background: "#fff7f1",
    borderColor: "rgba(255,106,0,0.35)",
    boxShadow: "0 10px 28px rgba(255,106,0,0.10)",
    transform: "scale(1)",
  },

  optionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  optionTitle: {
    fontSize: 20,
    lineHeight: 1.12,
    fontWeight: 760,
    letterSpacing: -0.45,
    marginBottom: 4,
  },

  optionSubtitle: {
    fontSize: 13.5,
    color: MUTED,
    lineHeight: 1.45,
  },

  indicator: {
    width: 24,
    height: 24,
    borderRadius: 999,
    border: "1.5px solid #cfd8e3",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
    transition: "all 160ms ease",
  },

  indicatorActive: {
    borderColor: ORANGE,
    background: "#fff1e8",
  },

  indicatorInner: {
    width: 11,
    height: 11,
    borderRadius: 999,
    background: ORANGE,
    transition: "all 160ms ease",
  },

  detailsWrap: {
    overflow: "hidden",
    transition: "all 220ms cubic-bezier(.22,1,.36,1)",
  },

  detailsText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: "#425466",
  },

  pillsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },

  pill: {
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

  secondaryBtn: {
    height: 56,
    borderRadius: 18,
    border: "1px solid #dde6ee",
    background: "#fff",
    color: TEXT,
    fontSize: 16,
    fontWeight: 700,
  },

  primaryBtn: {
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
