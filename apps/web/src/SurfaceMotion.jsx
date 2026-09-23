export function SurfaceIcon({ icon: Icon, emblem = false }) {
  return <span className={emblem ? "surface-icon task-emblem" : "surface-icon"} aria-hidden="true">
    <Icon size={emblem ? 32 : 22} weight="regular" />
  </span>;
}
