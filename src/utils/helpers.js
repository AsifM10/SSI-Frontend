export const normalizeTags = (raw) => {
  let list = [];

  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string" && raw.trim()) {
    const clean = raw.trim();

    if (clean === "string" || clean === "[]" || clean === "[null]" || clean === "null") {
      return [];
    }

    const stripped = clean.replace(/^\[|\]$/g, "");
    list = stripped ? stripped.split(",") : [];
  }

  return list.map((t) => String(t).trim()).filter(Boolean);
};