/**
 * WhatsAppFAB — Floating Action Button for WhatsApp
 * Fixed at the bottom-right corner of every dashboard page.
 */
export function WhatsAppFAB() {
  const phone = "5511940388766"; // +55 11 94038-8766
  const message = encodeURIComponent("Olá! Vim pelo sistema Efcon e gostaria de suporte.");
  const href = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contato via WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 transition-all duration-150 group"
    >
      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-7 h-7 fill-white"
        aria-hidden="true"
      >
        <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.736 5.472 2.027 7.774L0 32l8.467-2.002A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.27 13.27 0 0 1-6.773-1.853l-.485-.288-5.027 1.188 1.213-4.895-.317-.503A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.28-9.907c-.4-.2-2.365-1.167-2.731-1.3-.366-.133-.633-.2-.9.2s-1.033 1.3-1.267 1.567c-.233.267-.467.3-.867.1-.4-.2-1.688-.622-3.215-1.983-1.188-1.06-1.99-2.37-2.223-2.77-.233-.4-.025-.616.175-.816.18-.18.4-.467.6-.7.2-.233.267-.4.4-.667.133-.267.067-.5-.033-.7-.1-.2-.9-2.167-1.233-2.967-.325-.78-.655-.674-.9-.686l-.767-.013c-.267 0-.7.1-1.067.5s-1.4 1.367-1.4 3.333 1.433 3.867 1.633 4.133c.2.267 2.82 4.307 6.833 6.04.955.413 1.7.66 2.28.845.958.305 1.831.262 2.52.159.769-.115 2.365-.967 2.698-1.9.333-.933.333-1.733.233-1.9-.1-.167-.367-.267-.767-.467z" />
      </svg>

      {/* Tooltip on hover */}
      <span className="absolute right-16 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
        Falar no WhatsApp
      </span>
    </a>
  );
}
