import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon,
  Search, Filter, Eye, EyeOff, ChefHat, X, Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
  getManagerDashboard,
  getCanteenMenu,
  addDish,
  updateDish,
  deleteDish,
  toggleDishAvailability,
} from "../api/canteens";
import { api, buildFileUrl } from "../api/client";
import type { Dish, Canteen } from "../types";

const CATEGORIES = [
  { id: "breakfast", name: "Breakfast" },
  { id: "lunch", name: "Lunch" },
  { id: "dinner", name: "Dinner" },
  { id: "snacks", name: "Snacks" },
  { id: "beverages", name: "Beverages" },
  { id: "desserts", name: "Desserts" },
];

export default function MenuManagement() {
  // Data state
  const [canteen, setCanteen] = useState<Canteen | null>(null);
  const [menuItems, setMenuItems] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Dish | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "breakfast",
    isVeg: false,
  });

  // -------------------------------------------------------------------------
  // Fetch canteen & menu
  // -------------------------------------------------------------------------

  const fetchMenu = useCallback(async (canteenId: number) => {
    try {
      const res = await getCanteenMenu(canteenId);
      setMenuItems(res);
    } catch {
      toast.error("Failed to refresh menu");
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        const dashboard = await getManagerDashboard();
        const myCanteen = dashboard.canteen;

        setCanteen(myCanteen);
        const menuRes = await getCanteenMenu(myCanteen.id);
        setMenuItems(menuRes);
      } catch {
        setError("Failed to load menu data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // -------------------------------------------------------------------------
  // Form helpers
  // -------------------------------------------------------------------------

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", category: "breakfast", isVeg: false });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingItem(null);
    setShowAddModal(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // -------------------------------------------------------------------------
  // CRUD handlers
  // -------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteen) return;

    setSubmitting(true);
    try {
      if (editingItem) {
        // Update existing dish — use FormData if a new photo was selected
        if (photoFile) {
          const fd = new FormData();
          fd.append("name", formData.name);
          fd.append("price", formData.price);
          fd.append("description", formData.description);
          fd.append("category", formData.category);
          fd.append("is_veg", formData.isVeg ? "true" : "false");
          fd.append("photo", photoFile);
          await api.upload(`/api/canteens/dishes/${editingItem.id}/`, fd, "PATCH");
        } else {
          await updateDish(editingItem.id, {
            name: formData.name,
            description: formData.description,
            price: formData.price,
            category: formData.category,
            isVeg: formData.isVeg,
          });
        }
        toast.success("Dish updated successfully");
      } else {
        // Add new dish via FormData (supports photo upload)
        const fd = new FormData();
        fd.append("name", formData.name);
        fd.append("price", formData.price);
        fd.append("description", formData.description);
        fd.append("category", formData.category);
        fd.append("is_veg", formData.isVeg ? "true" : "false");
        if (photoFile) {
          fd.append("photo", photoFile);
        }
        await addDish(canteen.id, fd);
        toast.success("Dish added successfully");
      }

      resetForm();
      await fetchMenu(canteen.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(editingItem ? `Failed to update dish: ${message}` : `Failed to add dish: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Dish) => {
    setEditingItem(item);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isVeg: item.isVeg,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (dishId: number) => {
    if (!canteen) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteDish(dishId);
      toast.success("Dish deleted");
      await fetchMenu(canteen.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(`Failed to delete dish: ${message}`);
    }
  };

  const handleToggleAvailability = async (dishId: number) => {
    if (!canteen) return;

    try {
      const updated = await toggleDishAvailability(dishId);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === dishId ? updated : item)),
      );
      toast.success(updated.isAvailable ? "Dish marked as available" : "Dish marked as out of stock");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(`Failed to toggle availability: ${message}`);
    }
  };

  // -------------------------------------------------------------------------
  // Loading / Error states
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 text-[#D4725C] animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="size-8 text-red-500" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium text-lg mb-2">{error}</p>
          <Link
            to="/owner/dashboard"
            className="text-[#D4725C] hover:underline font-medium text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/owner/dashboard"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="size-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{canteen?.name}</p>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingItem(null);
                setFormData({ name: "", description: "", price: "", category: "breakfast", isVeg: false });
                setPhotoFile(null);
                setPhotoPreview(null);
                setShowAddModal(true);
              }}
              className="bg-[#D4725C] hover:bg-[#B85A4A] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <Plus className="size-5" />
              Add New Dish
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-8 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-12 pr-10 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] appearance-none bg-white dark:bg-gray-800 min-w-[220px] transition-all text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400 font-medium flex-wrap">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Total Items: <strong className="text-gray-900 dark:text-white">{filteredItems.length}</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Available: <strong className="text-gray-900 dark:text-white">{filteredItems.filter((i) => i.isAvailable).length}</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Out of Stock: <strong className="text-gray-900 dark:text-white">{filteredItems.filter((i) => !i.isAvailable).length}</strong>
            </span>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const imageUrl = buildFileUrl(item.photoUrl);
            return (
              <div key={item.id} className={`group bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 hover:shadow-xl transition-all duration-300 ${!item.isAvailable ? "opacity-70" : ""}`}>
                {/* Item Image */}
                <div className="relative h-56 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ImageIcon className="size-12 text-gray-300 dark:text-gray-600 group-hover:scale-110 transition-transform duration-500" />
                  )}
                  {!item.isAvailable && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      Out of Stock
                    </div>
                  )}
                  {item.isAvailable && (
                    <div className={`absolute top-4 right-4 ${item.isVeg ? "bg-green-600" : "bg-red-600"} text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm`}>
                      {item.isVeg ? "Veg" : "Non-Veg"}
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`backdrop-blur-sm p-2 rounded-full shadow-sm transition-colors ${!item.isAvailable
                        ? "bg-red-50/90 dark:bg-red-950/90 hover:bg-red-100 dark:hover:bg-red-900"
                        : "bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900"
                        }`}
                      title={!item.isAvailable ? "Mark as available" : "Mark as out of stock"}
                    >
                      {!item.isAvailable ? (
                        <EyeOff className="size-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <Eye className="size-4 text-green-600 dark:text-green-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Item Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white group-hover:text-[#D4725C] transition-colors">{item.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#D4725C]">
                        {"\u20B9"}{parseFloat(item.price).toFixed(0)}
                      </span>
                    </div>
                    <span className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] dark:text-orange-400 px-3 py-1 rounded-lg text-xs font-bold">
                      {CATEGORIES.find((c) => c.id === item.category)?.name || item.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleEdit(item)}
                      className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Edit className="size-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-red-100 dark:hover:border-red-800 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="size-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No menu items found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search or add a new dish.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingItem ? "Edit Dish" : "Add New Dish"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="size-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter dish name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Price ({"\u20B9"}) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer pb-3">
                      <input
                        type="checkbox"
                        name="isVeg"
                        checked={formData.isVeg}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        Vegetarian
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all appearance-none text-gray-900 dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Photo (Optional)
                    </label>
                    <label className="block border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-[#D4725C] hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all cursor-pointer group relative overflow-hidden">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setPhotoFile(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setPhotoPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          } else {
                            setPhotoPreview(null);
                          }
                        }}
                      />
                      {photoPreview ? (
                        <div className="relative">
                          <img src={photoPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{photoFile?.name} — Click to change</p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="size-12 text-gray-400 dark:text-gray-600 mx-auto mb-3 group-hover:text-[#D4725C] transition-colors" />
                          <p className="text-gray-600 dark:text-gray-400 mb-1 group-hover:text-gray-900 dark:group-hover:text-white font-medium">Click to upload or drag and drop</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">PNG, JPG up to 5MB</p>
                        </>
                      )}
                    </label>
                  </div>
                )}

                {editingItem && (editingItem as any).photoUrl && !photoPreview && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current photo will be kept unless you upload a new one.</p>
                )}

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className="flex-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-6 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-6 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {editingItem ? "Update Dish" : "Add Dish"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
