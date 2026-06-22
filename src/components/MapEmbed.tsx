// Lightweight, key-free map via the OpenStreetMap embed. This is a Phase 2
// placeholder; the plan calls for Google Maps once an API key is configured.
export function MapEmbed({
  lat,
  lng,
  label,
  zoomSpan = 0.012,
  className = "",
}: {
  lat: number;
  lng: number;
  label?: string;
  zoomSpan?: number;
  className?: string;
}) {
  const bbox = [
    lng - zoomSpan,
    lat - zoomSpan * 0.7,
    lng + zoomSpan,
    lat + zoomSpan * 0.7,
  ].join("%2C");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <iframe
      title={label ? `Map of ${label}` : "Map"}
      src={src}
      loading="lazy"
      className={`w-full rounded-xl border border-black/10 dark:border-white/10 ${className}`}
    />
  );
}
