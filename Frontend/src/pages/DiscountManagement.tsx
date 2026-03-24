import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Plus, Edit, Trash2, Tag, Percent, Calendar, Check, X } from "lucide-react";
import { Button } from "../components/ui/button";

interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  active: boolean;
}

const mockDiscounts: Discount[] = [
  {
    id: "1",
    code: "WELCOME50",
    type: "percentage",
    value: 50,
    minOrder: 100,
    maxDiscount: 100,
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    usageLimit: 100,
    usedCount: 23,
    active: true,
  },
  {
    id: "2",
    code: "FLAT30",
    type: "fixed",
    value: 30,
    minOrder: 150,
    validFrom: "2024-01-01",
    validTo: "2024-06-30",
    usageLimit: 50,
    usedCount: 12,
    active: true,
  },
];

export default function DiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>(mockDiscounts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    minOrder: "",
    maxDiscount: "",
    validFrom: "",
    validTo: "",
    usageLimit: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDiscount) {
      setDiscounts(discounts.map(discount => 
        discount.id === editingDiscount.id 
          ? {
              ...discount,
              code: formData.code,
              type: formData.type,
              value: parseFloat(formData.value),
              minOrder: parseFloat(formData.minOrder),
              maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
              validFrom: formData.validFrom,
              validTo: formData.validTo,
              usageLimit: parseInt(formData.usageLimit),
            }
          : discount
      ));
    } else {
      const newDiscount: Discount = {
        id: `${discounts.length + 1}`,
        code: formData.code,
        type: formData.type,
        value: parseFloat(formData.value),
        minOrder: parseFloat(formData.minOrder),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
        usageLimit: parseInt(formData.usageLimit),
        usedCount: 0,
        active: true,
      };
      setDiscounts([...discounts, newDiscount]);
    }

    setShowAddModal(false);
    setEditingDiscount(null);
    setFormData({
      code: "",
      type: "percentage",
      value: "",
      minOrder: "",
      maxDiscount: "",
      validFrom: "",
      validTo: "",
      usageLimit: "",
    });
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value.toString(),
      minOrder: discount.minOrder.toString(),
      maxDiscount: discount.maxDiscount?.toString() || "",
      validFrom: discount.validFrom,
      validTo: discount.validTo,
      usageLimit: discount.usageLimit.toString(),
    });
    setShowAddModal(true);
  };

  const handleDelete = (discountId: string) => {
    if (confirm("Are you sure you want to delete this discount?")) {
      setDiscounts(discounts.filter(d => d.id !== discountId));
    }
  };

  const handleToggleActive = (discountId: string) => {
    setDiscounts(discounts.map(d => 
      d.id === discountId ? { ...d, active: !d.active } : d
    ));
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-gray-950 relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4725C]/5 dark:bg-[#D4725C]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/5 dark:bg-green-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/owner/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft className="size-6 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discounts & Coupons</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Hall 1 Canteen</p>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingDiscount(null);
                setFormData({
                  code: "",
                  type: "percentage",
                  value: "",
                  minOrder: "",
                  maxDiscount: "",
                  validFrom: "",
                  validTo: "",
                  usageLimit: "",
                });
                setShowAddModal(true);
              }}
              className="bg-[#D4725C] hover:bg-[#B85A4A] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              <Plus className="size-5" />
              Create Discount
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Active Coupons</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{discounts.filter(d => d.active).length}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-950/30 p-3.5 rounded-2xl">
                 <Tag className="size-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Used</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{discounts.reduce((sum, d) => sum + d.usedCount, 0)}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-950/30 p-3.5 rounded-2xl">
                 <Percent className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Avg. Discount</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">25%</p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-950/30 p-3.5 rounded-2xl">
                 <Calendar className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Savings Given</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">₹1,250</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-950/30 p-3.5 rounded-2xl">
                 <Tag className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Discounts List */}
        <div className="space-y-4">
          {discounts.map((discount) => (
            <div key={discount.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 hover:shadow-md hover:border-orange-100 dark:hover:border-orange-900/50 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black font-mono text-gray-900 dark:text-white tracking-tight">{discount.code}</h3>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        discount.active
                          ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${discount.active ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-400'}`} />
                      {discount.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <span className="bg-[#D4725C]/10 dark:bg-[#D4725C]/20 text-[#D4725C] dark:text-orange-400 px-3 py-1 rounded-lg text-xs font-bold">
                      {discount.type === "percentage" ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm mt-4">
                    <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">Min. Order</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">₹{discount.minOrder}</p>
                    </div>
                    {discount.maxDiscount && (
                      <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl">
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">Max. Discount</p>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">₹{discount.maxDiscount}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">Valid Period</p>
                      <p className="font-bold text-gray-900 dark:text-white">{discount.validFrom} <span className="text-gray-400 dark:text-gray-500 mx-1">to</span> {discount.validTo}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">Usage</p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{discount.usedCount} <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">/ {discount.usageLimit}</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(discount.id)}
                    className={`p-2.5 rounded-xl transition-colors border ${
                      discount.active
                        ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title={discount.active ? "Deactivate" : "Activate"}
                  >
                    {discount.active ? <Check className="size-5" /> : <X className="size-5" />}
                  </button>
                  <button
                    onClick={() => handleEdit(discount)}
                    className="p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-transparent hover:border-blue-100 dark:hover:border-blue-800 rounded-xl transition-all"
                  >
                    <Edit className="size-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    className="p-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 border border-transparent hover:border-red-100 dark:hover:border-red-800 rounded-xl transition-all"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
                  <span>Usage Limit Reached</span>
                  <span>{Math.round((discount.usedCount / discount.usageLimit) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#D4725C] to-[#B85A4A] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(discount.usedCount / discount.usageLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {discounts.length === 0 && (
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="size-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No discounts created yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create one to boost sales!</p>
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
                  {editingDiscount ? "Edit Discount" : "Create New Discount"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDiscount(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="size-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] font-mono font-bold uppercase text-lg transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="WELCOME50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Discount Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all appearance-none text-gray-900 dark:text-white"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Value *
                    </label>
                    <input
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder={formData.type === "percentage" ? "50" : "100"}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Min. Order Value (₹) *
                    </label>
                    <input
                      type="number"
                      name="minOrder"
                      value={formData.minOrder}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Max. Discount (₹)
                    </label>
                    <input
                      type="number"
                      name="maxDiscount"
                      value={formData.maxDiscount}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      name="validFrom"
                      value={formData.validFrom}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                      Valid To *
                    </label>
                    <input
                      type="date"
                      name="validTo"
                      value={formData.validTo}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Usage Limit *
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4725C]/20 focus:border-[#D4725C] transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="100"
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingDiscount(null);
                    }}
                    className="flex-1 bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-6 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-6 rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/30 transition-all"
                  >
                    {editingDiscount ? "Update Discount" : "Create Discount"}
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