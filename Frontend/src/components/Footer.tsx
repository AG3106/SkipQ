import { Link } from "react-router";
import { Apple, PlayCircle, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4725C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B85A4A]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full px-4 py-16 relative z-10">
        {/* Top section */}
        <div className="flex justify-center mb-12">
          {/* Logo and tagline - centered */}
          <div className="max-w-md text-center">
            <div className="text-3xl font-bold mb-6 flex items-center justify-center gap-2">
              <span className="text-[#D4725C]">SkipQ</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The smartest way to order food at your university campus.
              <br />
              Skip the queue, enjoy the food.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-8 flex items-center justify-center text-sm text-gray-500">
          <p>© 2026 SkipQ - University Canteen Food Ordering System.</p>
        </div>
      </div>
    </footer>
  );
}