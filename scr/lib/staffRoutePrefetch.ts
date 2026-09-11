// Only page code is prefetched. No private data is fetched before authorization.
export function prefetchStaffRoute(href: string) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || connection?.effectiveType === "2g") return;

  const pathname = href.split("?")[0];
  const page = pathname === "/area-accqua/ranking" ? import("../pages/RankingStaff")
    : pathname === "/area-accqua/notificacoes" ? import("../pages/NotificationsStaff")
    : pathname === "/area-accqua/aulas" ? import("../pages/ClassesAdminV155")
    : pathname === "/area-accqua/loja" ? import("../pages/StoreAdmin")
    : import("../pages/AdminArea");
  // Navigation owns errors/retries; a speculative preload must not interrupt use.
  void page.catch(() => undefined);
}
