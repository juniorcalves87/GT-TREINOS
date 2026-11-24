import profile from "./startProfile.json" with { type: "json" };
import { showStart } from "../pages.js";

const STORAGE_KEY = "gt-treinos-start-checks-v1";

function todayKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function readChecks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveChecks(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn("Não foi possível salvar o checklist START neste navegador.", error);
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function readCurrentProfileSummary() {
  try {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!user) return "Entre e complete seu perfil para ver suas medidas aqui.";

    const details = [];
    const weight = Number(user.weight);
    const height = Number(user.height);
    const age = Number(user.age);
    if (Number.isFinite(weight) && weight > 0) details.push(`${weight} kg`);
    if (Number.isFinite(height) && height > 0) {
      details.push(`${(height / 100).toFixed(2).replace(".", ",")} m`);
    }
    if (Number.isFinite(age) && age > 0) details.push(`${age} anos`);
    return details.length ? details.join(" • ") : "Complete seu perfil para personalizar suas referências.";
  } catch {
    return "Complete seu perfil para personalizar suas referências.";
  }
}

function renderStart() {
  const root = document.getElementById("gt-start-root");
  if (!root || root.dataset.rendered === "true") return;

  root.innerHTML = "";
  root.setAttribute("aria-labelledby", "gt-start-title");

  const header = element("div", "gt-start-header");
  header.append(element("p", "gt-start-eyebrow", "MODO PERSONALIZADO"));
  const title = element("h2", "", "GT TREINOS START");
  title.id = "gt-start-title";
  header.append(title);
  header.append(element("p", "gt-start-subtitle", "Organize sua semana e acompanhe a consistência do treino."));

  const profileCard = element("div", "gt-start-card");
  profileCard.append(element("h3", "", "Referências do perfil"));
  profileCard.append(element("p", "gt-start-profile", readCurrentProfileSummary()));
  profileCard.append(element(
    "p",
    "gt-start-alert",
    "Antes de começar, confirme com um profissional quais atividades são adequadas à sua condição de saúde. Este módulo não prescreve exercícios nem cargas."
  ));

  const today = new Date().getDay();
  const index = today === 0 ? 6 : today - 1;
  const plan = profile.week[index];
  const planCard = element("div", "gt-start-card");
  planCard.append(element(
    "div",
    "gt-start-plan-top",
    `${plan.day} • ${plan.durationMin ? plan.durationMin + " min" : "Descanso"}`
  ));
  planCard.append(element("h3", "", plan.type));
  planCard.append(element("p", "", plan.focus));

  const checks = readChecks();
  const dateKey = todayKey();
  const list = element("ul", "gt-start-checklist");
  plan.items.forEach((item, itemIndex) => {
    const li = element("li");
    const label = element("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(checks[`${dateKey}:${itemIndex}`]);
    input.addEventListener("change", () => {
      const next = readChecks();
      next[`${dateKey}:${itemIndex}`] = input.checked;
      saveChecks(next);
    });
    label.append(input, element("span", "", item));
    li.append(label);
    list.append(li);
  });
  planCard.append(list);

  const nutrition = element("div", "gt-start-card");
  nutrition.append(element("h3", "", "Alimentação: princípios gerais"));
  const nutritionList = element("ul", "gt-start-checklist");
  profile.nutrition.principles.forEach((principle) => {
    nutritionList.append(element("li", "", principle));
  });
  nutrition.append(nutritionList);
  nutrition.append(element("p", "gt-start-muted", profile.nutrition.warning));

  const healthNote = element(
    "p",
    "gt-start-muted",
    "Interrompa qualquer atividade diante de dor, tontura, formigamento, fraqueza ou piora dos sintomas e procure orientação de saúde."
  );

  root.append(header, profileCard, planCard, nutrition, healthNote);
  root.dataset.rendered = "true";

  const nav = document.querySelector(".header-menu");
  if (nav && !document.getElementById("gt-start-nav-btn")) {
    const button = element("button", "nav-btn", "START");
    button.id = "gt-start-nav-btn";
    button.type = "button";
    button.addEventListener("click", showStart);
    nav.append(button);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderStart, { once: true });
} else {
  renderStart();
}
