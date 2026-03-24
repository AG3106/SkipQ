import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  ArrowLeft, Plus, Edit, Trash2, Image as ImageIcon, 
  Search, Filter, Eye, EyeOff, ChefHat, X
} from "lucide-react";
import { Button } from "../components/ui/button";
import { foodItems, FoodItem, foodCategories } from "../data/data";

export default function MenuManagement() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<FoodItem[]>(foodItems);
  const [outOfStockIds, setOutOfStockIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "breakfast",
    discount: "",
    available: true,
  });

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      // Update existing item
      setMenuItems(menuItems.map(item => 
        item.id === editingItem.id 
          ? { 
              ...item, 
              name: formData.name, 
              description: formData.description,
              price: parseFloat(formData.price),
              category: formData.category,
              discount: formData.discount ? parseFloat(formData.discount) : undefined,
            }
          : item
      ));
    } else {
      // Add new item
      const newItem: FoodItem = {
        id: `${menuItems.length + 1}`,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: "",
        category: formData.category,
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
      };
      setMenuItems([...menuItems, newItem]);
    }

    setShowAddModal(false);
    setEditingItem(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "breakfast",
      discount: "",
      available: true,
    });
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      discount: item.discount?.toString() || "",
      available: true,
    });
    setShowAddModal(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      setMenuItems(menuItems.filter(item => item.id !== itemId));
    }
  };

  const handleToggleAvailability = (itemId: string) => {
    setOutOfStockIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 relative overflow-x-hidden">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Hall 1 Canteen</p>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: "",
                  description: "",
                  price: "",
                  category: "breakfast",
                  discount: "",
                  available: true,
                });
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
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 dark:text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-12 pr-10 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] appearance-none bg-white dark:bg-gray-950 min-w-[220px] transition-all text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {foodCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <span className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-gray-400"></span>
               Total Items: <strong className="text-gray-900 dark:text-white">{filteredItems.length}</strong>
            </span>
            <span className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500"></span>
               Available: <strong className="text-gray-900 dark:text-white">{filteredItems.filter(i => !outOfStockIds.has(i.id)).length}</strong>
            </span>
            <span className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-red-500"></span>
               Out of Stock: <strong className="text-gray-900 dark:text-white">{filteredItems.filter(i => outOfStockIds.has(i.id)).length}</strong>
            </span>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className={`group bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-orange-100 dark:hover:border-orange-900/50 hover:shadow-xl transition-all duration-300 ${outOfStockIds.has(item.id) ? "opacity-70" : ""}`}>
              {/* Item Image */}
              <div className="relative h-56 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                <ImageIcon className="size-12 text-gray-300 dark:text-gray-600 group-hover:scale-110 transition-transform duration-500" />
                {item.discount && !outOfStockIds.has(item.id) && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    {item.discount}% OFF
                  </div>
                )}
                {outOfStockIds.has(item.id) && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    Out of Stock
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <button
                    onClick={() => handleToggleAvailability(item.id)}
                    className={`backdrop-blur-sm p-2 rounded-full shadow-sm transition-colors ${
                      outOfStockIds.has(item.id)
                        ? "bg-red-50/90 dark:bg-red-950/90 hover:bg-red-100 dark:hover:bg-red-900"
                        : "bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900"
                    }`}
                    title={outOfStockIds.has(item.id) ? "Mark as available" : "Mark as out of stock"}
                  >
                    {outOfStockIds.has(item.id) ? (
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
                    <span className="text-2xl font-black text-[#D4725C]">₹{item.price}</span>
                    {item.discount && (
                      <span className="text-sm text-gray-400 dark:text-gray-500 line-through decoration-gray-300 dark:decoration-gray-600">
                        ₹{(item.price / (1 - item.discount / 100)).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] dark:text-orange-400 px-3 py-1 rounded-lg text-xs font-bold">
                    {foodCategories.find(c => c.id === item.category)?.name}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit className="size-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-white dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-700 hover:border-red-100 dark:hover:border-red-800 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
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
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="0"
                    />
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
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all appearance-none text-gray-900 dark:text-white"
                  >
                    {foodCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

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

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingItem(null);
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="flex-1 bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-6 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-6 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30 transition-all"
                  >
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