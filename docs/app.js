
// Public board patch: Safely render names from object or string format
function getDisplayName(entry) {
  return typeof entry === "object" && entry !== null ? entry.name : entry;
}
