import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  Eye,
  FileUp,
  Filter,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "@/api/api";

const emptyMove = {
  stock_item: "",
  type_mouvement: "ENTREE",
  quantite: "",
  remarque: "",
};

const emptyItem = {
  nom: "",
  libelle: "",
  forme: "",
  dosage: "",
  unite: "",
  categorie: "",
  quantite: "",
  seuil_critique: "",
  date_expiration: "",
  description: "",
  actif: true,
  type_article: "MEDICAMENT",
};

const EXPIRY_SOON_DAYS = 30;
const PAGE_SIZE = 10;

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR");
};

const getExpiryStatus = (item) => {
  if (!item?.date_expiration) return "ok";
  const today = new Date();
  const exp = new Date(item.date_expiration);
  if (Number.isNaN(exp.getTime())) return "ok";
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "expired";
  if (diffDays <= EXPIRY_SOON_DAYS) return "soon";
  return "ok";
};

const getStockStatus = (item) => {
  if (!item) return "ok";
  if (item.quantite === 0) return "rupture";
  if (item.quantite <= item.seuil_critique) return "low";
  return "ok";
};

const getStatusLabel = (item) => {
  const expiry = getExpiryStatus(item);
  if (expiry === "expired") return "Expiré";
  if (expiry === "soon") return "Expire bientôt";
  const stock = getStockStatus(item);
  if (stock === "rupture") return "Rupture";
  if (stock === "low") return "Stock bas";
  return "En stock";
};

const statusClass = (item) => {
  const expiry = getExpiryStatus(item);
  if (expiry === "expired") return "bg-red-100 text-red-700";
  if (expiry === "soon") return "bg-amber-100 text-amber-700";
  const stock = getStockStatus(item);
  if (stock === "rupture") return "bg-rose-100 text-rose-700";
  if (stock === "low") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const StatCard = ({ title, value, icon, accent }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Badge = ({ children, className }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
    {children}
  </span>
);

const FilterSelect = ({ value, onChange, placeholder, options }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectedLabel =
    options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm hover:border-slate-400"
      >
        <span className={value ? "text-slate-900" : "text-slate-500"}>{selectedLabel}</span>
        <span className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="max-h-56 overflow-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value || option.label}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                    isSelected
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <span className="text-slate-700">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ModalShell = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
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

  const [categoryFilter, setCategoryFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showAlerts, setShowAlerts] = useState(false);
  const alertsRef = useRef(null);

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importErr, setImportErr] = useState("");
  const fileInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (!showAlerts) return;
    const handleClick = (event) => {
      if (!alertsRef.current?.contains(event.target)) {
        setShowAlerts(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAlerts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, formFilter, stockFilter, statusFilter]);

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

  const handleMoveChange = (e) => {
    const { name, value } = e.target;
    setMovement((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e, setter) => {
    const { name, value, type, checked } = e.target;
    setter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      setErr(e?.response?.data?.detail || "Erreur enregistrement mouvement stock.");
    } finally {
      setSavingMove(false);
    }
  };

  const buildPayload = (item) => ({
    nom: item.nom,
    libelle: item.libelle || null,
    forme: item.forme || null,
    dosage: item.dosage || null,
    unite: item.unite,
    categorie: item.categorie || null,
    quantite: Number(item.quantite || 0),
    seuil_critique: Number(item.seuil_critique || 0),
    date_expiration: item.date_expiration || null,
    description: item.description || null,
    actif: Boolean(item.actif),
    type_article: "MEDICAMENT",
  });

  const handleItemSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingItem(true);
      setErr("");

      await api.post("/medical/stock/items/", buildPayload(newItem));

      setNewItem(emptyItem);
      setShowItemForm(false);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || "Erreur ajout médicament.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setSavingEdit(true);
      setErr("");

      await api.patch(`/medical/stock/items/${editItem.id}/`, buildPayload(editItem));

      setEditItem({ ...emptyItem, id: null });
      setShowEditForm(false);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || "Erreur modification médicament.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteItem = async (item) => {
    const ok = window.confirm(
      `Supprimer le médicament "${item.nom}" ? Cette action est irréversible.`
    );
    if (!ok) return;

    try {
      setErr("");
      await api.delete(`/medical/stock/items/${item.id}/`);
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || "Erreur suppression médicament.");
    }
  };

  const startEditItem = (item) => {
    setEditItem({
      id: item.id,
      nom: item.nom || "",
      libelle: item.libelle || "",
      forme: item.forme || "",
      dosage: item.dosage || "",
      unite: item.unite || "",
      categorie: item.categorie || "",
      quantite: item.quantite ?? "",
      seuil_critique: item.seuil_critique ?? "",
      date_expiration: item.date_expiration || "",
      description: item.description || "",
      actif: item.actif ?? true,
      type_article: "MEDICAMENT",
    });
    setShowEditForm(true);
    setShowItemForm(false);
  };

  const openDetail = (item) => {
    setDetailItem(item);
    setShowDetail(true);
  };

  const handleToggleActive = async (item, event) => {
    event?.stopPropagation?.();
    try {
      setErr("");
      await api.patch(`/medical/stock/items/${item.id}/`, { actif: !item.actif });
      await loadItems();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.detail || "Erreur mise à jour statut.");
    }
  };

  const medicamentItems = useMemo(
    () => items.filter((item) => item.type_article === "MEDICAMENT"),
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return medicamentItems.filter((item) => {
      const matchesSearch = !q
        ? true
        : [item.nom, item.libelle, item.forme, item.dosage, item.categorie]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);

      const matchesCategory = categoryFilter
        ? normalizeValue(item.categorie) === normalizeValue(categoryFilter)
        : true;

      const matchesForm = formFilter
        ? normalizeValue(item.forme) === normalizeValue(formFilter)
        : true;

      const stockStatus = getStockStatus(item);
      const expiryStatus = getExpiryStatus(item);
      const matchesStock = stockFilter
        ? stockFilter === "expiry"
          ? expiryStatus === "expired" || expiryStatus === "soon"
          : stockStatus === stockFilter
        : true;

      const matchesStatus = statusFilter
        ? statusFilter === "active"
          ? Boolean(item.actif)
          : !item.actif
        : true;

      return matchesSearch && matchesCategory && matchesForm && matchesStock && matchesStatus;
    });
  }, [medicamentItems, search, categoryFilter, formFilter, stockFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagedItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const categories = useMemo(
    () => [
      { value: "", label: "Toutes catégories" },
      { value: "Antalgique", label: "Antalgique" },
      { value: "Anti-inflammatoire", label: "Anti-inflammatoire" },
      { value: "Antiseptique", label: "Antiseptique" },
      { value: "Antibiotique", label: "Antibiotique" },
      { value: "Antispasmodique", label: "Antispasmodique" },
      { value: "Antihistaminique", label: "Antihistaminique" },
      { value: "Antihypertenseur", label: "Antihypertenseur" },
      { value: "Antiémétique", label: "Antiémétique" },
      { value: "Antidiarrhéique", label: "Antidiarrhéique" },
      { value: "Vaccin", label: "Vaccin" },
    ],
    []
  );

  const forms = useMemo(
    () => [
      { value: "", label: "Toutes formes" },
      { value: "Comprimé", label: "Comprimé" },
      { value: "Gélule", label: "Gélule" },
      { value: "Sirop", label: "Sirop" },
      { value: "Solution injectable", label: "Solution injectable" },
      { value: "Solution buvable", label: "Solution buvable" },
      { value: "Pommade", label: "Pommade" },
      { value: "Crème", label: "Crème" },
      { value: "Gel", label: "Gel" },
      { value: "Collyre", label: "Collyre" },
      { value: "Suppositoire", label: "Suppositoire" },
    ],
    []
  );

  const stockOptions = useMemo(
    () => [
      { value: "", label: "Tout stock" },
      { value: "ok", label: "En stock" },
      { value: "low", label: "Stock bas" },
      { value: "rupture", label: "Rupture" },
      { value: "expiry", label: "Expiré / Bientôt" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "Tous" },
      { value: "active", label: "Actifs" },
      { value: "inactive", label: "Inactifs" },
    ],
    []
  );

  const stats = useMemo(() => {
    const totalActifs = medicamentItems.filter((item) => item.actif).length;
    const rupture = medicamentItems.filter((item) => item.quantite === 0).length;
    const low = medicamentItems.filter(
      (item) => item.quantite > 0 && item.quantite <= item.seuil_critique
    ).length;
    const expSoon = medicamentItems.filter((item) => {
      const status = getExpiryStatus(item);
      return status === "expired" || status === "soon";
    }).length;

    return { totalActifs, rupture, low, expSoon };
  }, [medicamentItems]);

  const alerts = useMemo(
    () =>
      medicamentItems
        .map((item) => {
          const expiry = getExpiryStatus(item);
          if (expiry === "expired") {
            return {
              id: `${item.id}-exp`,
              label: "Expiré",
              badge: "bg-red-100 text-red-700",
              detail: "Date dépassée",
              item,
            };
          }
          if (expiry === "soon") {
            return {
              id: `${item.id}-soon`,
              label: "Expire bientôt",
              badge: "bg-amber-100 text-amber-700",
              detail: `Expiration ${formatDate(item.date_expiration)}`,
              item,
            };
          }
          const stock = getStockStatus(item);
          if (stock === "rupture" || stock === "low") {
            return {
              id: `${item.id}-stock`,
              label: stock === "rupture" ? "Rupture" : "Stock bas",
              badge:
                stock === "rupture"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700",
              detail: `Stock ${item.quantite} / min ${item.seuil_critique}`,
              item,
            };
          }
          return null;
        })
        .filter(Boolean),
    [medicamentItems]
  );

  const toastLabel = `${alerts.length} médicament${alerts.length > 1 ? "s" : ""} en alerte`;
  const toastNames = alerts
    .slice(0, 3)
    .map((alert) => alert.item.nom)
    .join(", ");

  useEffect(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    if (alerts.length > 0) {
      setShowToast(true);
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false);
      }, 5000);
    } else {
      setShowToast(false);
    }
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [alerts.length]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportErr("");
      setImportMsg("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "update");

      const res = await api.post("/medical/medicaments/import/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const inserted = res.data?.inserted_count || 0;
      const updated = res.data?.updated_count || 0;
      const skipped = res.data?.skipped_count || 0;
      const processed = res.data?.processed_count;
      const errorCount = res.data?.error_count || 0;
      const processedLabel =
        typeof processed === "number" ? `, ${processed} lignes traitées` : "";
      const errorLabel = errorCount ? `, ${errorCount} erreurs` : "";
      setImportMsg(
        `Import réussi: ${inserted} ajoutés, ${updated} mis à jour, ${skipped} ignorés${processedLabel}${errorLabel}.`
      );
      if (inserted + updated === 0 && skipped > 0) {
        setImportErr(
          "Tous les éléments semblent déjà exister. Aucun nouvel élément n'a été ajouté."
        );
      }
      await loadItems();
    } catch (err) {
      console.error(err);
      setImportErr(err?.response?.data?.detail || "Erreur import Excel.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestion des médicaments</h1>
            <p className="mt-2 text-sm text-slate-500">
              Inventaire complet de la pharmacie — stock, expiration, ajout, modification
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative" ref={alertsRef}>
              <button
                type="button"
                onClick={() => setShowAlerts((prev) => !prev)}
                className="relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                <Bell size={18} />
                {alerts.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                    {alerts.length}
                  </span>
                )}
              </button>

              {showAlerts && (
                <div className="absolute right-0 mt-3 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Alertes médicaments</p>
                    <Badge className="bg-slate-100 text-slate-600">{alerts.length}</Badge>
                  </div>
                  <div className="max-h-64 space-y-3 overflow-auto">
                    {alerts.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucune alerte pour le moment.</p>
                    ) : (
                      alerts.map((alert) => (
                        <div key={alert.id} className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{alert.item.nom}</p>
                            <p className="text-xs text-slate-500">{alert.detail}</p>
                          </div>
                          <Badge className={alert.badge}>{alert.label}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleImportClick}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileUp size={16} />
              {importing ? "Import..." : "Importer"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              onClick={() => setShowMoveForm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ClipboardList size={16} />
              Mouvement stock
            </button>

            <button
              onClick={() => setShowItemForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {(err || importErr || importMsg) && (
        <div className="space-y-2">
          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}
          {importErr && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {importErr}
            </div>
          )}
          {importMsg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {importMsg}
            </div>
          )}
        </div>
      )}

      {showToast && alerts.length > 0 && (
        <div className="fixed bottom-4 left-4 z-50 w-[320px] rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <CircleAlert size={16} />
            {toastLabel}
          </div>
          <p className="mt-2 text-xs text-amber-700">
            {toastNames || "Consultez la liste des alertes."}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total actifs"
          value={stats.totalActifs}
          icon={<Boxes size={18} className="text-emerald-600" />}
          accent="bg-emerald-50"
        />
        <StatCard
          title="Rupture de stock"
          value={stats.rupture}
          icon={<CircleAlert size={18} className="text-rose-600" />}
          accent="bg-rose-50"
        />
        <StatCard
          title="Stock bas"
          value={stats.low}
          icon={<Filter size={18} className="text-amber-600" />}
          accent="bg-amber-50"
        />
        <StatCard
          title="Expiré / Bientôt"
          value={stats.expSoon}
          icon={<CalendarDays size={18} className="text-blue-600" />}
          accent="bg-blue-50"
        />
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, forme, dosage, catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <FilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            placeholder="Toutes catégories"
            options={categories}
          />

          <FilterSelect
            value={formFilter}
            onChange={setFormFilter}
            placeholder="Toutes formes"
            options={forms}
          />

          <FilterSelect
            value={stockFilter}
            onChange={setStockFilter}
            placeholder="Tout stock"
            options={stockOptions}
          />

          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Tous"
            options={statusOptions}
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Liste des médicaments</h2>
          <p className="text-sm text-slate-500">Inventaire détaillé des stocks</p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Chargement...</div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">Nom</th>
                  <th className="px-3 py-3 font-medium">Forme</th>
                  <th className="px-3 py-3 font-medium">Dosage</th>
                  <th className="px-3 py-3 font-medium">Catégorie</th>
                  <th className="px-3 py-3 font-medium">Stock</th>
                  <th className="px-3 py-3 font-medium">Expiration</th>
                  <th className="px-3 py-3 font-medium">Statut stock</th>
                  <th className="px-3 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {pagedItems.length > 0 ? (
                  pagedItems.map((item) => {
                    const percent = Math.min(
                      100,
                      Math.round(
                        (Number(item.quantite || 0) /
                          Math.max(Number(item.seuil_critique || 1), 1)) *
                          100
                      )
                    );
                    const expiryStatus = getExpiryStatus(item);
                    const expiryClass =
                      expiryStatus === "expired"
                        ? "text-red-600 font-semibold"
                        : expiryStatus === "soon"
                        ? "text-amber-600"
                        : "text-slate-600";

                    return (
                      <tr
                        key={item.id}
                        onClick={() => openDetail(item)}
                        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-3 py-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <Boxes size={16} className="text-slate-500" />
                            <div>
                              <p>{item.nom}</p>
                              <p className="text-xs text-slate-400">{item.libelle || "--"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-slate-600">{item.forme || "--"}</td>
                        <td className="px-3 py-4 text-slate-600">{item.dosage || "--"}</td>
                        <td className="px-3 py-4">
                          <Badge className="bg-slate-100 text-slate-600">
                            {item.categorie || "--"}
                          </Badge>
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          <div className="text-xs text-slate-500">
                            {item.quantite} / min {item.seuil_critique}
                          </div>
                          <div className="mt-2 h-2 w-28 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-slate-700"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className={`px-3 py-4 ${expiryClass}`}>
                          {formatDate(item.date_expiration)}
                        </td>
                        <td className="px-3 py-4">
                          <Badge className={statusClass(item)}>{getStatusLabel(item)}</Badge>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDetail(item);
                              }}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                              aria-label="Détails"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditItem(item);
                              }}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                              aria-label="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                              }}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                              aria-label="Historique"
                            >
                              <History size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteItem(item);
                              }}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-3 py-10 text-center text-slate-500">
                      Aucun médicament trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Page {safePage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] rounded-lg border px-3 py-1.5 text-sm ${
                    page === safePage
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ›
              </button>
            </div>
            </div>
          </div>
        )}
      </div>

      <ModalShell
        open={showDetail}
        title="Détails médicament"
        onClose={() => {
          setShowDetail(false);
          setDetailItem(null);
        }}
      >
        {detailItem && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">ID:</span>{" "}
                  {detailItem.id ? `MED${String(detailItem.id).padStart(3, "0")}` : "--"}
                </p>
                <p>
                  <span className="font-semibold">Nom:</span> {detailItem.nom || "--"}
                </p>
                <p>
                  <span className="font-semibold">Forme:</span> {detailItem.forme || "--"}
                </p>
                <p>
                  <span className="font-semibold">Unité:</span> {detailItem.unite || "--"}
                </p>
                <p>
                  <span className="font-semibold">Stock actuel:</span>{" "}
                  {detailItem.quantite ?? "--"}
                </p>
                <p>
                  <span className="font-semibold">Expiration:</span>{" "}
                  {formatDate(detailItem.date_expiration)}
                </p>
                <p>
                  <span className="font-semibold">Description:</span>{" "}
                  {detailItem.description || "--"}
                </p>
                <p>
                  <span className="font-semibold">Créé le:</span>{" "}
                  {formatDateTime(detailItem.created_at)}
                </p>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Statut:</span>
                  <Badge className={detailItem.actif ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>
                    {detailItem.actif ? "Actif" : "Inactif"}
                  </Badge>
                </p>
                <p>
                  <span className="font-semibold">Dénomination:</span>{" "}
                  {detailItem.libelle || detailItem.nom || "--"}
                </p>
                <p>
                  <span className="font-semibold">Dosage:</span> {detailItem.dosage || "--"}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Catégorie:</span>
                  <Badge className="bg-slate-100 text-slate-600">
                    {detailItem.categorie || "--"}
                  </Badge>
                </p>
                <p>
                  <span className="font-semibold">Stock min:</span>{" "}
                  {detailItem.seuil_critique ?? "--"}
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Statut stock:</span>
                  <Badge className={statusClass(detailItem)}>{getStatusLabel(detailItem)}</Badge>
                </p>
                <p>
                  <span className="font-semibold">Modifié le:</span>{" "}
                  {formatDateTime(detailItem.updated_at)}
                </p>
                <p>
                  <span className="font-semibold">Par:</span>{" "}
                  {detailItem.updated_by?.username || detailItem.created_by?.username || "--"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Stock & Expiration</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs text-slate-500">Stock actuel</p>
                  <p className="font-semibold text-slate-800">{detailItem.quantite ?? "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Stock min</p>
                  <p className="font-semibold text-slate-800">{detailItem.seuil_critique ?? "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Expiration</p>
                  <p className="font-semibold text-slate-800">
                    {formatDate(detailItem.date_expiration)}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-slate-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (Number(detailItem.quantite || 0) /
                          Math.max(Number(detailItem.seuil_critique || 1), 1)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={showItemForm}
        title="Ajouter un médicament"
        onClose={() => {
          setShowItemForm(false);
          setNewItem(emptyItem);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowItemForm(false);
                setNewItem(emptyItem);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="add-medicament-form"
              disabled={savingItem}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {savingItem ? "Enregistrement..." : "Ajouter"}
            </button>
          </div>
        }
      >
        <form id="add-medicament-form" onSubmit={handleItemSubmit} className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
            <input
              type="text"
              name="nom"
              value={newItem.nom}
              onChange={(e) => handleItemChange(e, setNewItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Dénomination / Libellé
            </label>
            <input
              type="text"
              name="libelle"
              value={newItem.libelle}
              onChange={(e) => handleItemChange(e, setNewItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Forme pharmaceutique
            </label>
            <input
              type="text"
              name="forme"
              value={newItem.forme}
              onChange={(e) => handleItemChange(e, setNewItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dosage</label>
            <input
              type="text"
              name="dosage"
              value={newItem.dosage}
              onChange={(e) => handleItemChange(e, setNewItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unité</label>
            <input
              type="text"
              name="unite"
              value={newItem.unite}
              onChange={(e) => handleItemChange(e, setNewItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
            <input
              type="text"
              name="categorie"
              value={newItem.categorie}
              onChange={(e) => handleItemChange(e, setNewItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Stock actuel</label>
            <input
              type="number"
              min="0"
              name="quantite"
              value={newItem.quantite}
              onChange={(e) => handleItemChange(e, setNewItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Stock minimal</label>
            <input
              type="number"
              min="0"
              name="seuil_critique"
              value={newItem.seuil_critique}
              onChange={(e) => handleItemChange(e, setNewItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Date d’expiration
            </label>
            <input
              type="date"
              name="date_expiration"
              value={newItem.date_expiration}
              onChange={(e) => handleItemChange(e, setNewItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              name="actif"
              checked={newItem.actif}
              onChange={(e) => handleItemChange(e, setNewItem)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label className="text-sm text-slate-700">Actif</label>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description / Remarque
            </label>
            <textarea
              name="description"
              value={newItem.description}
              onChange={(e) => handleItemChange(e, setNewItem)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={showEditForm}
        title="Modifier le médicament"
        onClose={() => {
          setShowEditForm(false);
          setEditItem({ ...emptyItem, id: null });
        }}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowEditForm(false);
                setEditItem({ ...emptyItem, id: null });
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="edit-medicament-form"
              disabled={savingEdit}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {savingEdit ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        }
      >
        <form
          id="edit-medicament-form"
          onSubmit={handleEditSubmit}
          className="grid gap-4 lg:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
            <input
              type="text"
              name="nom"
              value={editItem.nom}
              onChange={(e) => handleItemChange(e, setEditItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Dénomination / Libellé
            </label>
            <input
              type="text"
              name="libelle"
              value={editItem.libelle}
              onChange={(e) => handleItemChange(e, setEditItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Forme pharmaceutique
            </label>
            <input
              type="text"
              name="forme"
              value={editItem.forme}
              onChange={(e) => handleItemChange(e, setEditItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dosage</label>
            <input
              type="text"
              name="dosage"
              value={editItem.dosage}
              onChange={(e) => handleItemChange(e, setEditItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Unité</label>
            <input
              type="text"
              name="unite"
              value={editItem.unite}
              onChange={(e) => handleItemChange(e, setEditItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
            <input
              type="text"
              name="categorie"
              value={editItem.categorie}
              onChange={(e) => handleItemChange(e, setEditItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Stock actuel</label>
            <input
              type="number"
              min="0"
              name="quantite"
              value={editItem.quantite}
              onChange={(e) => handleItemChange(e, setEditItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Stock minimal</label>
            <input
              type="number"
              min="0"
              name="seuil_critique"
              value={editItem.seuil_critique}
              onChange={(e) => handleItemChange(e, setEditItem)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Date d’expiration
            </label>
            <input
              type="date"
              name="date_expiration"
              value={editItem.date_expiration}
              onChange={(e) => handleItemChange(e, setEditItem)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              name="actif"
              checked={editItem.actif}
              onChange={(e) => handleItemChange(e, setEditItem)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label className="text-sm text-slate-700">Actif</label>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Description / Remarque
            </label>
            <textarea
              name="description"
              value={editItem.description}
              onChange={(e) => handleItemChange(e, setEditItem)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
        </form>
      </ModalShell>

      <ModalShell
        open={showMoveForm}
        title="Nouveau mouvement"
        onClose={() => {
          setShowMoveForm(false);
          setMovement(emptyMove);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowMoveForm(false);
                setMovement(emptyMove);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="move-stock-form"
              disabled={savingMove}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {savingMove ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        }
      >
        <form id="move-stock-form" onSubmit={handleMoveSubmit} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Médicament</label>
            <select
              name="stock_item"
              value={movement.stock_item}
              onChange={handleMoveChange}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">Sélectionner</option>
              {medicamentItems.map((item) => (
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
        </form>
      </ModalShell>
    </div>
  );
}

