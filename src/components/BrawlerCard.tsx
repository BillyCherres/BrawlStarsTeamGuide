type Props = {
  name: string;
  imageUrl?: string;
  selected?: boolean;
  onSelect?: () => void;
};

export default function BrawlerCard({ name, imageUrl, selected = false, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "w-full text-left rounded-xl border p-4 bg-white shadow-sm transition",
        "hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-slate-400",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100 shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div>
          <h3 className="text-lg font-semibold leading-tight">{name}</h3>
          <p className="text-sm text-slate-600">Tap to add to team</p>
        </div>
      </div>
    </button>
  );
}
