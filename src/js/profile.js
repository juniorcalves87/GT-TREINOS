import { supabase } from "./supabase.js";
import { getAuthenticatedUser, updatePassword } from "./auth.js";
import uiTraining from "./Training/uiTraining.js";

function updateProfileForm(profile) {
  const values = {
    "#profile-name": profile.name || "",
    "#profile-email": profile.email || "",
    "#profile-weight": profile.weight ?? "",
    "#profile-height": profile.height ?? "",
    "#profile-goal": profile.goal || "",
    "#profile-age": profile.age ?? "",
    "#profile-gender": profile.gender || "",
  };
  Object.entries(values).forEach(([selector, value]) => {
    const input = document.querySelector(selector);
    if (input) input.value = value;
  });
}

export async function checkProfileCompletion() {
  if (!supabase) return null;
  try {
    const user = await getAuthenticatedUser();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email,name,age,gender,weight,height,goal,photo")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;

    const currentUser = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
      age: profile?.age ?? null,
      gender: profile?.gender ?? null,
      weight: profile?.weight ?? null,
      height: profile?.height ?? null,
      goal: profile?.goal ?? null,
      photo: profile?.photo ?? null,
    };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));

    const alertContainer = document.querySelector("#profile-alert-container");
    const complete = Boolean(currentUser.age && currentUser.gender && currentUser.weight && currentUser.height && currentUser.goal);
    if (alertContainer) alertContainer.classList.toggle("hidden", complete);
    updateProfileForm(currentUser);

    const avatar = document.querySelector("#profile-avatar-preview");
    if (avatar) {
      if (currentUser.photo) {
        const image = document.createElement("img");
        image.src = currentUser.photo;
        image.alt = "Foto do perfil";
        image.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%;";
        avatar.replaceChildren(image);
      } else {
        avatar.innerHTML = '<i class="fa-solid fa-user"></i>';
      }
    }
    return currentUser;
  } catch (error) {
    console.error("Erro ao carregar o perfil:", error);
    return null;
  }
}

export function initProfileEvents() {
  const form = document.querySelector("#profile-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const user = await getAuthenticatedUser();
        const newPassword = document.querySelector("#profile-password")?.value || "";
        const confirmPassword = document.querySelector("#profile-password-confirm")?.value || "";
        if (newPassword) {
          if (newPassword !== confirmPassword) {
            uiTraining.showToastTraining("As senhas não coincidem.", "error");
            return;
          }
          const passwordResult = await updatePassword(newPassword);
          if (!passwordResult.success) {
            uiTraining.showToastTraining(passwordResult.message || "Não foi possível alterar a senha.", "error");
            return;
          }
        }

        const updates = {
          email: user.email,
          name: document.querySelector("#profile-name").value.trim(),
          weight: document.querySelector("#profile-weight").value === "" ? null : Number(document.querySelector("#profile-weight").value),
          height: document.querySelector("#profile-height").value === "" ? null : Number(document.querySelector("#profile-height").value),
          goal: document.querySelector("#profile-goal").value || null,
          age: document.querySelector("#profile-age").value === "" ? null : Number(document.querySelector("#profile-age").value),
          gender: document.querySelector("#profile-gender").value || null,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("profiles").upsert(
          { id: user.id, ...updates },
          { onConflict: "id" },
        );
        if (error) throw error;

        document.querySelector("#profile-password").value = "";
        document.querySelector("#profile-password-confirm").value = "";
        await checkProfileCompletion();
        uiTraining.showToastTraining("Perfil atualizado com segurança!");
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        uiTraining.showToastTraining("Não foi possível salvar. Verifique a configuração do banco.", "error");
      }
    });
  }

  const photoInput = document.querySelector("#profile-photo-input");
  if (photoInput) {
    photoInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
        uiTraining.showToastTraining("Escolha uma imagem de até 2 MB.", "error");
        photoInput.value = "";
        return;
      }
      try {
        const user = await getAuthenticatedUser();
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const { error } = await supabase.from("profiles")
              .update({ photo: reader.result, updated_at: new Date().toISOString() })
              .eq("id", user.id);
            if (error) throw error;
            await checkProfileCompletion();
            uiTraining.showToastTraining("Foto atualizada!");
          } catch (error) {
            console.error(error);
            uiTraining.showToastTraining("Não foi possível salvar a foto.", "error");
          }
        };
        reader.onerror = () => uiTraining.showToastTraining("Não foi possível ler o arquivo.", "error");
        reader.readAsDataURL(file);
      } catch (error) {
        console.error(error);
        uiTraining.showToastTraining("Sessão inválida. Entre novamente.", "error");
      }
    });
  }
}
