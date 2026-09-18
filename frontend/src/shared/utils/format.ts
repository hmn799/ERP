export function formatDate(
  value: string | Date,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(new Date(value));
}

export function formatTime(
  value: string | Date,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(new Date(value));
}

export function formatCurrency(
  value: number | string,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(Number(value));
}

export function formatInteger(
  value: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
  ).format(value);
}