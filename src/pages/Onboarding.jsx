import { useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

import { useAuth } from "../context/AuthContext";

const ORANGE = "#FF6A00";

const BLACK = "#111111";

const GRAY = "#6B6B6B";

const LIGHT_GRAY = "#EAEAEA";

const BG = "#F7F7F5";

const WHITE = "#FFFFFF";

const TOTAL_STEPS = 3;

const SWIPE_THRESHOLD = 72;

export default function Onboarding() {

  const nav = useNavigate();

  const { user } = useAuth();

  const sliderRef = useRef(null);

  const startXRef = useRef(0);

  const startYRef = useRef(0);

  const currentXRef = useRef(0);

  const currentYRef = useRef(0);

  const draggingRef = useRef(false);

  const horizontalSwipeRef = useRef(false);

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

  useEffect(() => {

    if (typeof document === "undefined") return;

    const id = "fitdeal-onboarding-scroll-swipe-fix";

    if (document.getElementById(id)) return;

    const style = document.createElement("style");

    style.id = id;

    style.innerHTML = `

      html,

      body,

      #root {

        width: 100%;

        min-height: 100%;

        overflow-x: hidden !important;

        overscroll-behavior-x: none;

      }

      body {

        margin: 0;

      }

      .fitdeal-onboarding-page {

        overflow-x: hidden !important;

        overscroll-behavior-x: none;

      }

      .fitdeal-onboarding-scroll {

        overflow-y: auto;

        overflow-x: hidden;

        -webkit-overflow-scrolling: touch;

        overscroll-behavior-y: contain;

        overscroll-behavior-x: none;

        scrollbar-width: none;

      }

      .fitdeal-onboarding-scroll::-webkit-scrollbar {

        display: none;

      }

      button {

        font-family: inherit;

        -webkit-tap-highlight-color: transparent;

        cursor: pointer;

      }

      button:active {

        transform: scale(.985);

      }

    `;

    document.head.appendChild(style);

  }, []);

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

      subtitle: "Mais construção muscular",

      details:

        "Seu treino vai priorizar ganho de massa, progressão de carga e estímulo mais forte para evolução estética consistente.",

      metrics: ["Mais volume muscular", "Progressão de carga", "Ênfase estética"],

      objetivo: "Hipertrofia",

    },

    {

      key: "emagrecimento",

      title: "Emagrecimento",

      subtitle: "Mais gasto e constância",

      details:

        "A estrutura foca em gasto calórico, ritmo semanal forte e sessões eficientes para melhorar composição corporal sem perder qualidade.",

      metrics: ["Mais gasto calórico", "Rotina dinâmica", "Melhor constância"],

      objetivo: "Emagrecimento",

    },

    {

      key: "performance",

      title: "Performance",

      subtitle: "Mais força e rendimento",

      details:

        "O treino fica voltado para desempenho, força, resistência e melhora atlética geral, com estímulos mais funcionais e estratégicos.",

      metrics: ["Mais força", "Melhor rendimento", "Base atlética"],

      objetivo: "Performance",

    },

  ];

  const step2Options = [

    {

      key: "iniciante",

      title: "Iniciante",

      subtitle: "Estrutura sugerida: Full Body",

      details:

        "A melhor base para aprender execução, ganhar consistência e evoluir sem excessos. O treino fica eficiente e simples de seguir.",

      metrics: ["Base técnica", "Mais adaptação", "Evolução segura"],

      nivel: "Iniciante",

      split: "Full Body",

      intensidade: "moderada",

    },

    {

      key: "intermediario",

      title: "Intermediário",

      subtitle: "Estrutura sugerida: ABC",

      details:

        "Aqui já vale aumentar volume e distribuir melhor os grupos musculares, com uma divisão mais forte para crescer e evoluir.",

      metrics: ["Mais volume", "Divisão equilibrada", "Boa hipertrofia"],

      nivel: "Intermediário",

      split: "ABC",

      intensidade: "moderada",

    },

    {

      key: "avancado",

      title: "Avançado",

      subtitle: "Estrutura sugerida: ABCD",

      details:

        "Permite uma organização mais profunda do treino, com foco mais detalhado por músculo e estímulos mais refinados.",

      metrics: ["Mais especificidade", "Maior refinamento", "Intensidade alta"],

      nivel: "Avançado",

      split: "ABCD",

      intensidade: "alta",

    },

  ];

  const step3Options = [

    {

      key: 2,

      title: "2x por semana",

      subtitle: "Mais objetivo",

      details:

        "Boa opção para rotina apertada, com sessões diretas e estratégicas para manter evolução.",

      metrics: ["Boa aderência", "Mais recuperação", "Treino enxuto"],

      frequencia: 2,

    },

    {

      key: 3,

      title: "3x por semana",

      subtitle: "Equilíbrio forte",

      details:

        "Uma das frequências mais eficientes para manter progresso, boa recuperação e constância.",

      metrics: ["Ótimo equilíbrio", "Boa recuperação", "Boa evolução"],

      frequencia: 3,

    },

    {

      key: 4,

      title: "4x por semana",

      subtitle: "Mais estímulo",

      details:

        "Permite aumentar o volume semanal e distribuir melhor os estímulos para acelerar a evolução.",

      metrics: ["Mais volume", "Mais estímulo", "Maior evolução visual"],

      frequencia: 4,

    },

    {

      key: 5,

      title: "5x por semana",

      subtitle: "Foco total",

      details:

        "Ideal para quem quer uma rotina mais forte e estruturada, com mais profundidade no treino.",

      metrics: ["Maior foco", "Treino completo", "Mais especialização"],

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

    const touch = e.touches[0];

    draggingRef.current = true;

    horizontalSwipeRef.current = false;

    startXRef.current = touch.clientX;

    startYRef.current = touch.clientY;

    currentXRef.current = touch.clientX;

    currentYRef.current = touch.clientY;

  }

  function handleTouchMove(e) {

    if (!draggingRef.current || !sliderRef.current) return;

    const touch = e.touches[0];

    currentXRef.current = touch.clientX;

    currentYRef.current = touch.clientY;

    let deltaX = currentXRef.current - startXRef.current;

    const deltaY = currentYRef.current - startYRef.current;

    const absX = Math.abs(deltaX);

    const absY = Math.abs(deltaY);

    if (!horizontalSwipeRef.current) {

      if (absY > absX && absY > 8) {

        setDragPx(0);

        return;

      }

      if (absX > absY + 10 && absX > 12) {

        horizontalSwipeRef.current = true;

      } else {

        return;

      }

    }

    if (horizontalSwipeRef.current) {

      e.preventDefault();

      if (step === 0 && deltaX > 0) deltaX *= 0.35;

      if (step === TOTAL_STEPS - 1 && deltaX < 0) deltaX *= 0.35;

      setDragPx(deltaX);

    }

  }

  function handleTouchEnd() {

    if (!draggingRef.current) return;

    draggingRef.current = false;

    const deltaX = currentXRef.current - startXRef.current;

    if (horizontalSwipeRef.current && deltaX < -SWIPE_THRESHOLD && canContinue() && step < TOTAL_STEPS - 1) {

      goNext();

    } else if (horizontalSwipeRef.current && deltaX > SWIPE_THRESHOLD && step > 0) {

      goPrev();

    } else {

      setDragPx(0);

    }

    horizontalSwipeRef.current = false;

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

      localStorage.removeItem("fitdeal_after_auth_redirect");

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

    <div className="fitdeal-onboarding-page" style={S.page}>

      <div style={S.wrap}>

        <div style={S.header}>

          <div style={S.brand}>

            fitdeal<span style={{ color: ORANGE }}>.</span>

          </div>

          <div style={S.progressBlock}>

            <div style={S.progressTrack}>

              <div style={{ ...S.progressFill, width: progressWidth }} />

            </div>

          </div>

        </div>

        <div

          ref={sliderRef}

          style={S.viewport}

          onTouchStart={handleTouchStart}

          onTouchMove={handleTouchMove}

          onTouchEnd={handleTouchEnd}

          onTouchCancel={handleTouchEnd}

        >

          <div

            style={{

              ...S.track,

              width: `${TOTAL_STEPS * 100}%`,

              transform: `translateX(calc(-${step * (100 / TOTAL_STEPS)}% + ${dragPx}px))`,

              transition: draggingRef.current

                ? "none"

                : "transform 260ms cubic-bezier(.22,1,.36,1)",

            }}

          >

            <div className="fitdeal-onboarding-scroll" style={S.slide}>

              <div style={S.slideInner}>{step === 0 ? renderQuestionBlock() : null}</div>

            </div>

            <div className="fitdeal-onboarding-scroll" style={S.slide}>

              <div style={S.slideInner}>{step === 1 ? renderQuestionBlock() : null}</div>

            </div>

            <div className="fitdeal-onboarding-scroll" style={S.slide}>

              <div style={S.slideInner}>{step === 2 ? renderQuestionBlock() : null}</div>

            </div>

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

    height: "100dvh",

    width: "100%",

    background: BG,

    color: BLACK,

    overflow: "hidden",

    overflowX: "hidden",

    boxSizing: "border-box",

    overscrollBehaviorX: "none",

  },

  wrap: {

    height: "100dvh",

    maxWidth: 560,

    margin: "0 auto",

    padding: "calc(22px + env(safe-area-inset-top)) 18px calc(14px + env(safe-area-inset-bottom))",

    display: "flex",

    flexDirection: "column",

    boxSizing: "border-box",

    overflow: "hidden",

  },

  header: {

    flexShrink: 0,

  },

  brand: {

    fontSize: 32,

    lineHeight: 1,

    fontWeight: 800,

    letterSpacing: -1.3,

    marginBottom: 18,

    color: BLACK,

  },

  progressBlock: {

    marginBottom: 18,

  },

  progressTrack: {

    width: "100%",

    height: 10,

    borderRadius: 999,

    background: "#E8E8E8",

    overflow: "hidden",

  },

  progressFill: {

    height: "100%",

    borderRadius: 999,

    background: `linear-gradient(90deg, ${ORANGE} 0%, #FF8A33 100%)`,

    transition: "width 260ms cubic-bezier(.22,1,.36,1)",

  },

  viewport: {

    position: "relative",

    overflow: "hidden",

    flex: 1,

    minHeight: 0,

    WebkitUserSelect: "none",

    userSelect: "none",

    touchAction: "pan-y",

    overscrollBehaviorX: "none",

  },

  track: {

    display: "flex",

    height: "100%",

    willChange: "transform",

  },

  slide: {

    width: `${100 / TOTAL_STEPS}%`,

    height: "100%",

    flexShrink: 0,

    boxSizing: "border-box",

    minWidth: 0,

    touchAction: "pan-y",

  },

  slideInner: {

    minHeight: "100%",

    boxSizing: "border-box",

    paddingBottom: 16,

  },

  questionBalloon: {

    background: WHITE,

    border: `1px solid ${LIGHT_GRAY}`,

    borderRadius: 30,

    padding: "22px 18px",

    boxShadow: "0 14px 32px rgba(0,0,0,0.05)",

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

    color: BLACK,

  },

  questionSubtitle: {

    fontSize: 14,

    lineHeight: 1.5,

    color: GRAY,

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

    border: `1px solid ${LIGHT_GRAY}`,

    background: WHITE,

    borderRadius: 24,

    padding: "18px 16px",

    boxShadow: "0 8px 24px rgba(0,0,0,0.03)",

    transition:

      "border-color 170ms ease, background 170ms ease, box-shadow 170ms ease, transform 170ms ease",

    boxSizing: "border-box",

  },

  optionCardActive: {

    background: "#FFF7F1",

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

    color: BLACK,

  },

  optionSubtitle: {

    fontSize: 13.5,

    color: GRAY,

    lineHeight: 1.45,

  },

  indicator: {

    width: 24,

    height: 24,

    borderRadius: 999,

    border: "1.5px solid #D6D6D6",

    background: WHITE,

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    flexShrink: 0,

    marginTop: 2,

    transition: "all 160ms ease",

  },

  indicatorActive: {

    borderColor: ORANGE,

    background: "#FFF1E8",

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

    color: "#3F3F3F",

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

    background: WHITE,

    border: "1px solid #E7E7E7",

    fontSize: 12.5,

    lineHeight: 1.2,

    color: BLACK,

  },

  bottomBar: {

    flexShrink: 0,

    display: "grid",

    gridTemplateColumns: "112px 1fr",

    gap: 12,

    paddingTop: 14,

    background: BG,

    boxSizing: "border-box",

  },

  secondaryBtn: {

    height: 56,

    borderRadius: 18,

    border: "1px solid #DEDEDE",

    background: WHITE,

    color: BLACK,

    fontSize: 16,

    fontWeight: 700,

  },

  primaryBtn: {

    height: 56,

    borderRadius: 18,

    border: "none",

    background: BLACK,

    color: WHITE,

    fontSize: 16,

    fontWeight: 800,

    letterSpacing: -0.2,

    boxShadow: "0 10px 24px rgba(0,0,0,0.10)",

  },

};
