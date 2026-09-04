import type { Property } from "@/src/types";

export function filterProperties(properties: Property[], query: string, status: string, statuses: Record<string, string>) {
  const normalized = query.trim().toLowerCase();
  return properties.filter((property) => {
    const matchesQuery = `${property.name} ${property.nameKm} ${property.province} ${property.type}`.toLowerCase().includes(normalized);
    const currentStatus = statuses[property.id] || property.status;
    return matchesQuery && (status === "All" || currentStatus === status);
  });
}
