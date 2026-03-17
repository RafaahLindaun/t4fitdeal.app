import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const ORANGE = "#FF6A00";
const BLACK = "#111111";
const GRAY = "#6B6B6B";
const WHITE = "#FFFFFF";
const BORDER = "#E9E9E7";
const LIGHT = "#F7F7F5";

export default function Conta() {
  const { user } = useAuth();
  const nav = useNavigate();

  const userId = user?.id;

  const [photoUrl, setPhotoUrl] = useState("");
  const [creatorCode, setCreatorCode] = useState("");
  const [notifTreino, setNotifTreino] = useState(true);
  const [notifPagamento, setNotifPagamento] = useState(true);
  const [privacidadePerfil, setPrivacidadePerfil] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setPhotoUrl(data.photo_url || "");
        setCreatorCode(data.creator_code || "");
        setNotifTreino(data.notif_treino ?? true);
        setNotifPagamento(data.notif_pagamento ?? true);
        setPrivacidadePerfil(data.privacidade_perfil ?? false);
      }

      setLoading(false);
    }

    loadSettings();
  }, [userId]);

  async function saveSettings(updated) {
    if (!userId) return;

    await supabase.from("user_settings").upsert({
      user_id: userId,
      photo_url: updated.photoUrl,
      creator_code: updated.creatorCode,
      notif_treino: updated.notifTreino,
      notif_pagamento: updated.notifPagamento,
      privacidade_perfil: updated.privacidadePerfil,
    });
  }

  function updatePhoto(url) {
    setPhotoUrl(url);

    saveSettings({
      photoUrl: url,
      creatorCode,
      notifTreino,
      notifPagamento,
      privacidadePerfil,
    });
  }

  function updateCreatorCode(value) {
    setCreatorCode(value);

    saveSettings({
      photoUrl,
      creatorCode: value,
      notifTreino,
      notifPagamento,
      privacidadePerfil,
    });
  }

  function toggleTreino() {
    const value = !notifTreino;
    setNotifTreino(value);

    saveSettings({
      photoUrl,
      creatorCode,
      notifTreino: value,
      notifPagamento,
      privacidadePerfil,
    });
  }

  function togglePagamento() {
    const value = !notifPagamento;
    setNotifPagamento(value);

    saveSettings({
      photoUrl,
      creatorCode,
      notifTreino,
      notifPagamento: value,
      privacidadePerfil,
    });
  }

  function togglePrivacidade() {
    const value = !privacidadePerfil;
    setPrivacidadePerfil(value);

    saveSettings({
      photoUrl,
      creatorCode,
      notifTreino,
      notifPagamento,
      privacidadePerfil: value,
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={styles.brand}>
            fitdeal<span style={{ color: ORANGE }}>.</span>
          </div>
        </div>

        <div style={styles.title}>Conta</div>

        {loading ? (
          <div style={styles.loading}>Carregando...</div>
        ) : (
          <>
            <div style={styles.section}>
              <div style={styles.label}>Foto de perfil</div>

              <input
                value={photoUrl}
                onChange={(e) => updatePhoto(e.target.value)}
                placeholder="URL da foto"
                style={styles.input}
              />
            </div>

            <div style={styles.section}>
              <div style={styles.label}>Código de criador</div>

              <input
                value={creatorCode}
                onChange={(e) => updateCreatorCode(e.target.value)}
                placeholder="Digite seu código"
                style={styles.input}
              />
            </div>

            <div style={styles.section}>
              <div style={styles.label}>Notificações de treino</div>

              <button style={styles.toggle} onClick={toggleTreino}>
                {notifTreino ? "Ativado" : "Desativado"}
              </button>
            </div>

            <div style={styles.section}>
              <div style={styles.label}>Notificações de pagamento</div>

              <button style={styles.toggle} onClick={togglePagamento}>
                {notifPagamento ? "Ativado" : "Desativado"}
              </button>
            </div>

            <div style={styles.section}>
              <div style={styles.label}>Perfil privado</div>

              <button style={styles.toggle} onClick={togglePrivacidade}>
                {privacidadePerfil ? "Privado" : "Público"}
              </button>
            </div>

            <button style={styles.back} onClick={() => nav(-1)}>
              Voltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: LIGHT,
    padding: 20,
  },

  wrap: {
    maxWidth: 600,
    margin: "0 auto",
  },

  header: {
    marginBottom: 20,
  },

  brand: {
    fontSize: 28,
    fontWeight: 900,
    color: BLACK,
  },

  title: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 20,
    color: BLACK,
  },

  loading: {
    fontSize: 14,
    color: GRAY,
  },

  section: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    color: GRAY,
    marginBottom: 6,
  },

  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    padding: "0 12px",
    fontSize: 14,
  },

  toggle: {
    height: 42,
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    background: WHITE,
    padding: "0 14px",
    fontWeight: 700,
  },

  back: {
    marginTop: 20,
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "none",
    background: ORANGE,
    color: BLACK,
    fontWeight: 800,
  },
};
