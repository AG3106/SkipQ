import { Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import type { Dish } from "../types";

type AddToCartSize = "sm" | "md" | "lg";

interface AddToCartButtonProps {
  dish: Dish;
  canteenId: number;
  canteenName: string;
  size?: AddToCartSize;
  fullWidth?: boolean;
  stopPropagation?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    addButton: "px-3 py-1.5 rounded-xl text-xs gap-1.5",
    addIcon: "size-3.5",
    stepperWrapper: "p-0.5 gap-1",
    stepperButton: "size-7",
    stepperIcon: "size-3.5",
    quantity: "text-xs w-5",
  },
  md: {
    addButton: "py-2 rounded-xl text-sm gap-1.5",
    addIcon: "size-4",
    stepperWrapper: "p-1",
    stepperButton: "size-8",
    stepperIcon: "size-4",
    quantity: "text-sm w-6",
  },
  lg: {
    addButton: "py-3 rounded-xl text-base gap-2",
    addIcon: "size-5 group-hover/btn:rotate-90 transition-transform",
    stepperWrapper: "p-1.5",
    stepperButton: "size-10",
    stepperIcon: "size-5",
    quantity: "text-lg w-8",
  },
};

export function AddToCartButton({
  dish,
  canteenId,
  canteenName,
  size = "md",
  fullWidth = true,
  stopPropagation = false,
  className = "",
}: AddToCartButtonProps) {
  const { items, addItem, updateQuantity } = useCart();

  const cartItem = items.find((ci) => ci.dishId === dish.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const config = sizeConfig[size];

  const handleEvent = (e: React.MouseEvent, fn: () => void) => {
    if (stopPropagation) e.stopPropagation();
    fn();
  };

  const handleAdd = () => {
    addItem({
      dishId: dish.id,
      name: dish.name,
      price: typeof dish.price === "number" ? dish.price : parseFloat(dish.price),
      photoUrl: dish.photoUrl || null,
      category: dish.category || "",
      isVeg: dish.isVeg ?? true,
      canteenId,
      canteenName,
    });
  };

  if (quantity === 0) {
    return (
      <button
        onClick={(e) => handleEvent(e, handleAdd)}
        className={`${fullWidth ? "w-full" : ""} bg-white dark:bg-gray-950 border-2 border-[#D4725C] text-[#D4725C] hover:bg-[#D4725C] hover:text-white font-bold transition-all duration-300 shadow-sm hover:shadow-orange-200 dark:hover:shadow-orange-900/50 flex items-center justify-center group/btn ${config.addButton} ${className}`}
      >
        Add to Order
        <Plus className={config.addIcon} />
      </button>
    );
  }

  return (
    <div
      className={`${fullWidth ? "w-full" : ""} flex items-center ${fullWidth ? "justify-between" : ""} bg-gray-50 dark:bg-gray-950 rounded-xl border border-orange-100 dark:border-orange-900/50 shadow-inner ${config.stepperWrapper} ${className}`}
    >
      <button
        onClick={(e) => handleEvent(e, () => updateQuantity(dish.id, quantity - 1))}
        className={`${config.stepperButton} flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:text-[#D4725C] shadow-sm hover:shadow transition-all border border-gray-100 dark:border-gray-800`}
      >
        <Minus className={config.stepperIcon} />
      </button>
      <span className={`${config.quantity} font-bold text-gray-900 dark:text-white text-center`}>
        {quantity}
      </span>
      <button
        onClick={(e) => handleEvent(e, () => updateQuantity(dish.id, quantity + 1))}
        className={`${config.stepperButton} flex items-center justify-center rounded-lg bg-[#D4725C] text-white shadow-md hover:bg-[#B85A4A] transition-all shadow-orange-200 dark:shadow-orange-900/50`}
      >
        <Plus className={config.stepperIcon} />
      </button>
    </div>
  );
}
