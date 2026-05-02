"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/icons/WhatsApp";

const PHONE = "237600000000"; // placeholder

export default function WhatsAppButton() {
  const { t } = useI18n();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  if (isDashboard) return null;
  const message = encodeURIComponent(t("whatsapp_message"));

  return (
    <motion.a
      href={`https://wa.me/${PHONE}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 250, damping: 18 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full bg-[#25D366] text-white h-14 w-14 sm:h-auto sm:w-auto sm:justify-start sm:gap-2 sm:pl-3 sm:pr-4 sm:py-3 shadow-[0_10px_30px_-8px_rgba(37,211,102,0.55)] hover:bg-[#1ebe57]"
      aria-label="Chat on WhatsApp"
    >
      <span className="relative flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-[#25D366]/70 animate-ping" />
        <WhatsAppIcon className="relative h-7 w-7 sm:h-5 sm:w-5" />
      </span>
      <span className="text-sm font-semibold hidden sm:inline">{t("whatsapp_help")}</span>
    </motion.a>
  );
}
