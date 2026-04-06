import { useEffect, useMemo, useState } from "react";
import { Boxes, Plus, Search, TriangleAlert } from "lucide-react";
import { api } from "@/api/api";

const emptyMove = {
  stock_item: "",
  type_mouvement: "ENTREE",
  quantite: "",
  remarque: "",
};

const emptyItem = {
  nom: "",
  type_article: "MEDICAMENT",
  quantite: "",
  seuil_critique: "",
  unite: "",
};

const typeLabel = {
  MEDICAMENT: "Médicament",
  CONSOMMABLE: "Consommable",
};

export default function StockPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  const [showMoveForm, setShowMoveForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [movement, setMovement] = useState(emptyMove);
  const [newItem, setNewItem] = useState(emptyItem);
  const [editItem, setEditItem] = useState({ ...emptyItem, id: null });

  const [loading, setLoading] = useState(true);
  const [savingMove, setSavingMove] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await api.get("/medical/stock/items/");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setErr("Erreur chargement stock.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [item.nom, item.type_article, item.unite].join(" ").toLowerCase().includes(q)
    );
  }, [items, search]);

  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.quantite <= item.seuil_critique);
  }, [items]);

  const handleMoveChange = (e) => {
    const { name, value } = e.target;
    setMovement((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingMove(true);
      setErr("");

      await api.post("/medical/stock/movements/", {
        stock_item: Number(movement.stock_item),
        type_mouvement: movement.type_mouvement,
        quantite: Number(movement.quantite),
        remarque: movement.remarque,
      });

      setMovement(emptyMove);
      setShowMoveForm(false);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data?.detail || "Erreur enregistrement mouvement stock."
      );
    } finally {
      setSavingMove(false);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingItem(true);
      setErr("");

      await api.post("/medical/stock/items/", {
        nom: newItem.nom,
        type_article: newItem.type_article,
        quantite: Number(newItem.quantite),
        seuil_critique: Number(newItem.seuil_critique),
        unite: newItem.unite,
      });

      setNewItem(emptyItem);
      setShowItemForm(false);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(
        e?.response?.data?.detail || "Erreur ajout article."
      );
    } finally {
      setSavingItem(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingEdit(true);
      setErr("");

      await api.patch(`/medical/stock/items/${editItem.id}/`, {
        nom: editItem.nom,
        type_article: editItem.type_article,
        quantite: Number(editItem.quantite),
        seuil_critique: Number(editItem.seuil_critique),
        unite: editItem.unite,
      });

      setEditItem({ ...emptyItem, id: null });
      setShowEditForm(false);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || "Erreur modification article.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const ok = window.confirm(
      `Supprimer l'article "${item.nom}" ? Cette action est irréversible.`
    );
    if (!ok) return;

    try {
      setErr("");
      await api.delete(`/medical/stock/items/${item.id}/`);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || "Erreur suppression article.");
    }
  };

  const startEditItem = (item) => {
    setEditItem({
      id: item.id,
      nom: item.nom || "",
      type_article: item.type_article || "MEDICAMENT",
      quantite: item.quantite ?? "",
      seuil_critique: item.seuil_critique ?? "",
      unite: item.unite || "",
    });
    setShowEditForm(true);
    setShowItemForm(false);
  };

  const stockBadge = (item) => {
    if (item.quantite <= item.seuil_critique) {
      return "bg-red-100 text-red-700";
    }
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Module Infirmier</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Gestion du stock</h1>
            <p className="mt-2 text-sm text-slate-500">
              Suivre les médicaments, consommables et mouvements de stock.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowItemForm((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus size={16} />
              {showItemForm ? "Fermer article" : "Nouvel article"}
            </button>

            <button
              onClick={() => setShowMoveForm((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={16} />
              {showMoveForm ? "Fermer mouvement" : "Mouvement stock"}
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-2">
          <TriangleAlert className="text-red-500" size={20} />
          <h2 className="text-lg font-semibold text-slate-900">Alertes stock faible</h2>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500">Chargement...</div>
        ) : lowStockItems.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-red-100 bg-red-50 p-4"
              >
                <p className="font-medium text-slate-900">{item.nom}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {typeLabel[item.type_article] || item.type_article}
                </p>
                <p className="mt-3 text-sm text-red-700">
                  Quantité: <span className="font-semibold">{item.quantite}</span> {item.unite}
                </p>
                <p className="text-xs text-slate-500">
                  Seuil: {item.seuil_critique} {item.unite}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">Aucune alerte pour le moment.</div>
        )}
      </div>

      {showItemForm && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Nouvel article</h2>

          <form onSubmit={handleItemSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom article</label>
              <input
                type="text"
                name="nom"
                value={newItem.nom}
                onChange={handleItemChange}
                required
                placeholder="Ex: Augmentin 1g"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                name="type_article"
                value={newItem.type_article}
                onChange={handleItemChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="MEDICAMENT">Médicament</option>
                <option value="CONSOMMABLE">Consommable</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantité initiale</label>
              <input
                type="number"
                min="0"
                name="quantite"
                value={newItem.quantite}
                onChange={handleItemChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Seuil critique</label>
              <input
                type="number"
                min="0"
                name="seuil_critique"
                value={newItem.seuil_critique}
                onChange={handleItemChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Unité</label>
              <input
                type="text"
                name="unite"
                value={newItem.unite}
                onChange={handleItemChange}
                required
                placeholder="Ex: boîtes, flacons, paquets..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setNewItem(emptyItem);
                  setShowItemForm(false);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={savingItem}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
              >
                {savingItem ? "Enregistrement..." : "Ajouter article"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Modifier article</h2>

          <form onSubmit={handleEditSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom article</label>
              <input
                type="text"
                name="nom"
                value={editItem.nom}
                onChange={handleEditChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select
                name="type_article"
                value={editItem.type_article}
                onChange={handleEditChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="MEDICAMENT">Médicament</option>
                <option value="CONSOMMABLE">Consommable</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantité</label>
              <input
                type="number"
                min="0"
                name="quantite"
                value={editItem.quantite}
                onChange={handleEditChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Seuil critique</label>
              <input
                type="number"
                min="0"
                name="seuil_critique"
                value={editItem.seuil_critique}
                onChange={handleEditChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="xl:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Unité</label>
              <input
                type="text"
                name="unite"
                value={editItem.unite}
                onChange={handleEditChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditItem({ ...emptyItem, id: null });
                  setShowEditForm(false);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={savingEdit}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
              >
                {savingEdit ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showMoveForm && (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">Nouveau mouvement</h2>

          <form onSubmit={handleMoveSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Article</label>
              <select
                name="stock_item"
                value={movement.stock_item}
                onChange={handleMoveChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="">Sélectionner</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type mouvement</label>
              <select
                name="type_mouvement"
                value={movement.type_mouvement}
                onChange={handleMoveChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="ENTREE">Entrée</option>
                <option value="SORTIE">Sortie</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quantité</label>
              <input
                type="number"
                min="1"
                name="quantite"
                value={movement.quantite}
                onChange={handleMoveChange}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Remarque</label>
              <input
                type="text"
                name="remarque"
                value={movement.remarque}
                onChange={handleMoveChange}
                placeholder="Optionnel"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMovement(emptyMove);
                  setShowMoveForm(false);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={savingMove}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
              >
                {savingMove ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Liste du stock</h2>
            <p className="text-sm text-slate-500">Médicaments et consommables disponibles</p>
          </div>

          <div className="relative w-full lg:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Article</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Quantité</th>
                  <th className="px-3 py-3 font-medium">Unité</th>
                  <th className="px-3 py-3 font-medium">Seuil</th>
                  <th className="px-3 py-3 font-medium">État</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Boxes size={16} className="text-slate-500" />
                          {item.nom}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        {typeLabel[item.type_article] || item.type_article}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{item.quantite}</td>
                      <td className="px-3 py-3 text-slate-700">{item.unite}</td>
                      <td className="px-3 py-3 text-slate-700">{item.seuil_critique}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stockBadge(item)}`}>
                          {item.quantite <= item.seuil_critique ? "Critique" : "Disponible"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditItem(item)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-10 text-center text-slate-500">
                      Aucun article trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
