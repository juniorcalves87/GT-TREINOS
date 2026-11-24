import { supabase } from "../supabase.js";
import { getAuthenticatedUserId } from "../auth.js";

const exercisesApi = {
  async getExercises() {
    const ownerId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("owner_id", ownerId)
      .order("id", { ascending: true });
    if (error) throw new Error(`Erro ao buscar exercícios: ${error.message}`);
    return data || [];
  },

  async getExercisesById(id) {
    const ownerId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao buscar exercício: ${error.message}`);
    return data;
  },

  async createExercises(exercise) {
    const ownerId = await getAuthenticatedUserId();
    const { owner_id, ...safeExercise } = exercise;
    const { data, error } = await supabase
      .from("exercises")
      .insert([{ ...safeExercise, owner_id: ownerId }])
      .select()
      .single();
    if (error) throw new Error(`Erro ao salvar exercício: ${error.message}`);
    return data;
  },

  async updateExercises(exercise) {
    const ownerId = await getAuthenticatedUserId();
    const { id, owner_id, ...safeExercise } = exercise;
    const { data, error } = await supabase
      .from("exercises")
      .update(safeExercise)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Erro ao editar exercício: ${error.message}`);
    return data;
  },

  async deleteExercises(id) {
    const ownerId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw new Error(`Erro ao excluir exercício: ${error.message}`);
    return true;
  },
};

export default exercisesApi;
