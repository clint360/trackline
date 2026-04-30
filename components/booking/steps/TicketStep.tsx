"use client";

import { useRef } from "react";
import { Download, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { downloadAsPdf, downloadAsPng } from "@/lib/download";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";
import { Ticket, type TicketData } from "@/components/booking/Ticket";

export function TicketStep({
  ticket,
  onRestart,
}: {
  ticket: TicketData;
  onRestart: () => void;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const png = async () => {
    if (!ref.current) return;
    try {
      await downloadAsPng(ref.current, `${ticket.consignment}.png`);
      toast.success(t("png_downloaded"));
    } catch {
      toast.error(t("export_failed_png"));
    }
  };

  const pdf = async () => {
    if (!ref.current) return;
    try {
      await downloadAsPdf(ref.current, `${ticket.consignment}.pdf`);
      toast.success(t("pdf_downloaded"));
    } catch {
      toast.error(t("export_failed_pdf"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-semibold"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t("booking_confirmed")}
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 mt-3 text-balance">
          {t("ticket_ready")}
        </h2>
        <p className="text-ink-500 text-sm mt-1">{t("sms_copy")}</p>
      </div>

      <Ticket ref={ref} data={ticket} />

      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button onClick={png} className="btn-secondary">
          <Download className="h-4 w-4" /> {t("download_png")}
        </button>
        <button onClick={pdf} className="btn-secondary">
          <FileDown className="h-4 w-4" /> {t("download_pdf")}
        </button>
        <button onClick={onRestart} className="btn-primary">
          {t("book_another")}
        </button>
      </div>

      <p className="text-center text-xs text-ink-400 mt-4">
        {t("lookup_link")}:{" "}
        <a
          className="text-brand-600 hover:underline"
          href={`/ticket/${ticket.consignment}`}
        >
          /ticket/{ticket.consignment}
        </a>
      </p>
    </div>
  );
}
