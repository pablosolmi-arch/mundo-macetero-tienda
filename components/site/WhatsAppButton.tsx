// Floating WhatsApp contact button, matching the live storefront's bottom-right
// bubble. Update the number to the real business line when available.
const WHATSAPP_URL = "https://wa.me/56900000000";

export function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contáctanos por WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: "var(--wa)" }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white" aria-hidden>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.1c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.07-1.82-.11-.42-.11-.96-.29-1.66-.59-2.92-1.26-4.83-4.2-4.98-4.4-.14-.2-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2.01.89 2.16.07.14.12.31.02.51-.09.2-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.57.16.29.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.2.69-.8.87-1.08.18-.28.36-.23.61-.14.24.09 1.55.73 1.82.86.27.14.44.2.51.32.07.11.07.66-.17 1.34Z" />
      </svg>
    </a>
  );
}
