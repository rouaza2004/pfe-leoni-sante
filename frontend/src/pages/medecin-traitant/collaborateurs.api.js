import { api } from "@/api/api";

export const getCollaborateurs = async (search = "") => {
  const res = await api.get("/collaborateurs/", {
    params: search ? { search } : {},
  });
  return res.data;
};
