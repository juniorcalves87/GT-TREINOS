import { supabase, isSupabaseConfigured } from "./supabase.js";

const CACHE_KEY = "currentUser";

function setCachedUser(user, profile = {}) {
  const cached = {
    id: user.id,
    email: user.email,
    name: profile.name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
    age: profile.age ?? null,
    gender: profile.gender ?? null,
    weight: profile.weight ?? null,
    height: profile.height ?? null,
    goal: profile.goal ?? null,
    photo: profile.photo ?? null,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  return cached;
}

async function readProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,name,age,gender,weight,height,goal,photo")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data || {};
}

function setAuthVisibility(isAuthenticated) {
  const appContent = document.querySelector("#app-content");
  const loginSection = document.querySelector("#login-section");
  const registerSection = document.querySelector("#register-section");
  if (appContent) appContent.classList.toggle("hidden", !isAuthenticated);
  if (loginSection) loginSection.classList.toggle("hidden", isAuthenticated);
  if (registerSection) registerSection.classList.add("hidden");
}

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
  }
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sessão expirada. Faça login novamente.");
  return data.user;
}

export async function getAuthenticatedUserId() {
  return (await getAuthenticatedUser()).id;
}

export async function register(name, email, password) {
  if (!supabase) return { success: false, message: "Supabase não configurado neste ambiente." };

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { name: name.trim() },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) return { success: false, message: error.message };

  if (data.session && data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: data.user.id, email: data.user.email, name: name.trim() },
      { onConflict: "id" },
    );
    if (profileError) {
      await supabase.auth.signOut();
      return { success: false, message: "Conta criada, mas o perfil não foi inicializado. Verifique a migração do banco." };
    }
    setCachedUser(data.user, { name: name.trim() });
  }
  return { success: true, needsEmailConfirmation: !data.session };
}

export async function login(email, password) {
  if (!supabase) return false;
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) return false;

  try {
    const profile = await readProfile(data.user);
    setCachedUser(data.user, profile);
    return true;
  } catch (profileError) {
    console.error("Falha ao carregar o perfil:", profileError);
    await supabase.auth.signOut();
    return false;
  }
}

export async function checkAuth() {
  if (!supabase) {
    localStorage.removeItem(CACHE_KEY);
    setAuthVisibility(false);
    return false;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    localStorage.removeItem(CACHE_KEY);
    setAuthVisibility(false);
    return false;
  }
  try {
    setCachedUser(data.user, await readProfile(data.user));
  } catch (profileError) {
    console.error("Falha ao sincronizar perfil:", profileError);
    setCachedUser(data.user);
  }
  setAuthVisibility(true);
  return true;
}

export async function logout() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  localStorage.removeItem(CACHE_KEY);
}

export async function requestPasswordReset(email) {
  if (!supabase) return { success: false, message: "Supabase não configurado neste ambiente." };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: window.location.origin,
  });
  return error ? { success: false, message: error.message } : { success: true };
}

export async function updatePassword(password) {
  if (!supabase) return { success: false, message: "Supabase não configurado neste ambiente." };
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { success: false, message: error.message } : { success: true };
}

if (supabase) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") localStorage.removeItem(CACHE_KEY);
    if (event === "PASSWORD_RECOVERY") {
      const modal = document.querySelector("#update-password-modal");
      if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("active");
      }
    }
  });
}
