// Currency formatting
export const formatCurrency = (value) => {
  if (!value) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

export const formatFullCurrency = (value) => {
  if (!value) return "$0";
  return `$${value.toLocaleString()}`;
};

// Number formatting
export const formatFollowers = (value) => {
  if (!value) return "—";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

export const formatNumber = (value) => {
  if (!value) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

// Date formatting
export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const date = typeof dateStr === 'number' 
    ? new Date(dateStr * 1000) 
    : new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

