import { Link } from "react-router";
import { Apple, PlayCircle, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4725C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B85A4A]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Logo and download */}
          <div className="lg:col-span-1">
            <div className="text-3xl font-bold mb-6 flex items-center gap-2">
              <span className="text-[#D4725C]">SkipQ</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              The smartest way to order food at your university campus. Skip the queue, enjoy the food.
            </p>
            <div className="space-y-3">
              <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl w-full transition-all group">
                <Apple className="size-6 text-white group-hover:text-[#D4725C] transition-colors" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Download on the</div>
                  <div className="text-sm font-bold text-white">App Store</div>
                </div>
              </button>
              <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl w-full transition-all group">
                <PlayCircle className="size-6 text-white group-hover:text-[#D4725C] transition-colors" />
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">GET IT ON</div>
                  <div className="text-sm font-bold text-white">Google Play</div>
                </div>
              </button>
            </div>
          </div>

          {/* Spacer for desktop layout */}
          <div className="hidden lg:block"></div>

          {/* Links Sections */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Company</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">About Us</Link></li>
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">Careers</Link></li>
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">Blog</Link></li>
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">Press</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Support</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">Help Center</Link></li>
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="hover:text-[#D4725C] transition-colors">Partner with us</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="font-bold text-lg mb-6 text-white">Contact</h3>
            <div className="space-y-4 text-gray-400">
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer Support</p>
                <p className="text-[#D4725C] font-bold text-lg">1800-123-4567</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email us</p>
                <p className="text-white hover:text-[#D4725C] transition-colors cursor-pointer">support@skipq.com</p>
              </div>
              
              <div className="pt-4 flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D4725C] hover:text-white transition-all text-gray-400">
                  <Instagram className="size-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D4725C] hover:text-white transition-all text-gray-400">
                  <Twitter className="size-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#D4725C] hover:text-white transition-all text-gray-400">
                  <Linkedin className="size-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2026 SkipQ - University Canteen Food Ordering System.</p>
          <div className="flex gap-6">
             <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
             <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
             <span className="hover:text-white cursor-pointer transition-colors">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
