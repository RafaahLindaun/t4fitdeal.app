/** The ranking RPC groups activities by the calendar month in São Paulo. */
export function currentRankingPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const year = value("year");
  const month = value("month");
  const day = value("day");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const next = new Date(Date.UTC(year, month, 1));
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
  return {
    key: `${year}-${String(month).padStart(2, "0")}-01`,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    range: `1 a ${lastDay} de ${new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)))}`,
    resetLabel: new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" }).format(next),
    daysRemaining: lastDay - day + 1,
  };
}
