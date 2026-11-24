import { supabase } from "../supabase.js";
import { getAuthenticatedUserId } from "../auth.js";

const loadsApi = {
  async getLoads() {
    const ownerId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .eq("owner_id", ownerId)
      .order("date", { ascending: false });
    if (error) throw new Error(`Erro ao buscar cargas: ${error.message}`);
    return data || [];
  },

  async getLoadById(id) {
    const ownerId = await getAuthenticatedUserId();
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .eq("id", id)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao buscar carga: ${error.message}`);
    return data;
  },

  async createLoads(load) {
    const ownerId = await getAuthenticatedUserId();
    const { owner_id, ...safeLoad } = load;
    const { data, error } = await supabase
      .from("loads")
      .insert([{ ...safeLoad, owner_id: ownerId }])
      .select()
      .single();
    if (error) throw new Error(`Erro ao salvar carga: ${error.message}`);
    return data;
  },

  async updateloads(load) {
    const ownerId = await getAuthenticatedUserId();
    const { id, owner_id, ...safeLoad } = load;
    const { data, error } = await supabase
      .from("loads")
      .update(safeLoad)
      .eq("id", id)
      .eq("owner_id", ownerId)
      .select()
      .maybeSingle();
    if (error) throw new Error(`Erro ao editar carga: ${error.message}`);
    return data;
  },

  async deleteloads(id) {
    const ownerId = await getAuthenticatedUserId();
    const { error } = await supabase
      .from("loads")
      .delete()
      .eq("id", id)
      .eq("owner_id", ownerId);
    if (error) throw new Error(`Erro ao excluir carga: ${error.message}`);
    return true;
  },
};

export default loadsApi;
