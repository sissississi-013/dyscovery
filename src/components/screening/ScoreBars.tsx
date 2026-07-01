import { CONSTRUCT_LABELS } from "@/lib/games/types";
import { bandLabel } from "@/lib/screening/scoring";
import { TaskScore } from "@/lib/screening/types";

const BAND_COLOR: Record<ReturnType<typeof bandLabel>, string> = {
  strong: "var(--success)",
  developing: "var(--accent)",
  emerging: "var(--warning)",
};

export function ScoreBars({ scores }: { scores: TaskScore[] }) {
  return (
    <ul className="space-y-3">
      {scores.map((s) => {
        const band = bandLabel(s.score);
        return (
          <li key={s.construct}>
            <div className="flex justify-between text-sm font-semibold mb-1">
              <span>{CONSTRUCT_LABELS[s.construct]}</span>
              <span className="capitalize text-muted">{band}</span>
            </div>
            <div
              className="h-3 w-full rounded-full bg-surface-2 overflow-hidden"
              role="img"
              aria-label={`${CONSTRUCT_LABELS[s.construct]}: ${band}, ${Math.round(s.score)} out of 100`}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${s.score}%`, background: BAND_COLOR[band] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
