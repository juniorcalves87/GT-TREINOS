import { supabase } from "../supabase.js";
import { getAuthenticatedUserId } from "../auth.js";

const trainingApi = {
  async getTrainings() {
    const ownerId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .eq("owner_id", ownerId)
      .order("id", { ascending: true });
    if (error) throw new Error(`Erro ao buscar treinos: ${error.message}`);
    return data || [];
  },

  async getTrainingById(id) {
    const ownerId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao buscar treino: ${error.message}`);
    return data;
  },

  async createTraining(training) {
    const ownerId = await getAuthenticatedUserId();
    const { owner_id, ...safeTraining } = training;
    const { data, error } = await supabase
      .from("trainings")
      .insert([{ ...safeTraining, owner_id: ownerId }])
      .select()
      .single();
    if (error) throw new Error(`Erro ao salvar treino: ${error.message}`);
    return data;
  },

  async updateTraining(training) {
    const ownerId = await getAuthenticatedUserId();
    const { id, owner_id, ...safeTraining } = training;
    const { data, error } = await supabase
      .from("trainings")
      .update(safeTraining)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Erro ao editar treino: ${error.message}`);
    return data;
  },

  async deleteTraining(id) {
    const ownerId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from("trainings")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw new Error(`Erro ao excluir treino: ${error.message}`);
    return true;
  },

  async saveHistory(historyData) {
    const ownerId = await getAuthenticatedUserId();
    const { owner_id, ...safeHistory } = historyData;
    const { data, error } = await supabase
      .from("history")
      .insert([{ ...safeHistory, owner_id: ownerId }])
      .select()
      .single();
    if (error) throw new Error(`Erro ao salvar histórico: ${error.message}`);
    return data;
  },

  async getHistory() {
    const ownerId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from("history")
      .select("*")
      .eq("owner_id", ownerId)
      .order("date", { ascending: true });
    if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`);
    return data || [];
  },
};

export default trainingApi;
