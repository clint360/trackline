"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminLogin } from "@/components/dashboard/AdminLogin";
import {
  Sidebar,
  MobileSidebar,
} from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardStoreProvider } from "@/components/dashboard/StoreProvider";

const LOCAL_KEY = "trackline:admin:authenticated";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authed, setAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setAuthed(localStorage.getItem(LOCAL_KEY) === "1");
    setHydrated(true);
  }, []);

  // Always close the mobile drawer when the route changes — without this the
  // Link onClick can race with router.push under concurrent rendering and leave
  // the z-40 backdrop stuck blocking all taps until a hard refresh.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!hydrated) return null;

  return (
    <main className="min-h-screen bg-ink-50/40">
      <AnimatePresence mode="wait">
        {authed ? (
          <motion.div
            key="dash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-screen bg-ink-50/40"
          >
            <Sidebar />
            <MobileSidebar
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
            />

            <div className="flex-1 min-w-0 flex flex-col">
              <TopBar
                onMenu={() => setMobileOpen(true)}
                onLogout={() => {
                  localStorage.removeItem(LOCAL_KEY);
                  setAuthed(false);
                }}
              />

              <DashboardStoreProvider>
                <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                  <div className="max-w-6xl mx-auto">{children}</div>
                </div>
              </DashboardStoreProvider>
            </div>
          </motion.div>
        ) : (
          <AdminLogin
            key="login"
            onAuthenticated={() => {
              localStorage.setItem(LOCAL_KEY, "1");
              setAuthed(true);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
