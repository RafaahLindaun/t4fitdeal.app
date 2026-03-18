async function updateUser(updates) {
  try {
    const currentUserId = user?.id;

    if (!currentUserId) {
      return { ok: false, msg: "Usuário não encontrado." };
    }

    const payload = {
      id: currentUserId,
    };

    if (updates.nome !== undefined) payload.nome = updates.nome || null;
    if (updates.idade !== undefined) {
      payload.idade = updates.idade === "" ? null : Number(updates.idade);
    }
    if (updates.altura !== undefined) {
      payload.altura = updates.altura === "" ? null : Number(updates.altura);
    }
    if (updates.peso !== undefined) {
      payload.peso = updates.peso === "" ? null : Number(updates.peso);
    }
    if (updates.objetivo !== undefined) payload.objetivo = updates.objetivo || null;
    if (updates.frequencia !== undefined) {
      payload.frequencia =
        updates.frequencia === "" ? null : Number(updates.frequencia);
    }
    if (updates.nivel !== undefined) payload.nivel = updates.nivel || null;
    if (updates.split !== undefined) payload.split = updates.split || null;
    if (updates.intensidade !== undefined) {
      payload.intensidade = updates.intensidade || null;
    }
    if (updates.onboarded !== undefined) {
      payload.onboarded = !!updates.onboarded;
    }
    if (updates.photoUrl !== undefined) {
      payload.photo_url = updates.photoUrl || null;
    }

    const request = supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tempo limite ao salvar perfil.")), 10000)
    );

    const { error } = await Promise.race([request, timeout]);

    if (error) {
      console.error("updateUser error:", error);
      return { ok: false, msg: error.message };
    }

    setUser((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...updates,
        nome: updates.nome !== undefined ? updates.nome : prev.nome,
        idade: updates.idade !== undefined ? updates.idade : prev.idade,
        altura: updates.altura !== undefined ? updates.altura : prev.altura,
        peso: updates.peso !== undefined ? updates.peso : prev.peso,
        objetivo:
          updates.objetivo !== undefined ? updates.objetivo : prev.objetivo,
        frequencia:
          updates.frequencia !== undefined ? updates.frequencia : prev.frequencia,
        nivel: updates.nivel !== undefined ? updates.nivel : prev.nivel,
        split: updates.split !== undefined ? updates.split : prev.split,
        intensidade:
          updates.intensidade !== undefined
            ? updates.intensidade
            : prev.intensidade,
        onboarded:
          updates.onboarded !== undefined ? updates.onboarded : prev.onboarded,
        photoUrl:
          updates.photoUrl !== undefined ? updates.photoUrl : prev.photoUrl,
      };
    });

    return { ok: true };
  } catch (err) {
    console.error("updateUser catch:", err);
    return {
      ok: false,
      msg: err?.message || "Erro ao atualizar usuário.",
    };
  }
}
