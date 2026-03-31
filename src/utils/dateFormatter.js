/**
 * Formats an ISO date string into a Thai Buddhist Era (BE) date/time string.
 * Example: "2026-03-28T04:05:51" -> "28 มีนาคม 2569 11:05 น."
 */
export const formatThaiDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }).format(date) + " น.";
};
