"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ActiveProfile } from "@/lib/profile/types";
import { switchProfile, deleteActiveProfile } from "@/lib/profile/actions";

export function ProfileControls({
  profiles,
  activeId,
}: {
  profiles: ActiveProfile[];
  activeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSwitch = (id: string) =>
    startTransition(async () => {
      await switchProfile(id);
      router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      await deleteActiveProfile();
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {profiles.length > 1 && (
        <label className="text-sm font-semibold flex items-center gap-2">
          Child:
          <select
            value={activeId}
            onChange={(e) => onSwitch(e.target.value)}
            disabled={pending}
            className="rounded-lg border border-border bg-surface px-3 py-1.5"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </label>
      )}
      <Link
        href="/profile/new"
        className="text-sm rounded-full border border-border bg-surface px-4 py-1.5 hover:bg-surface-2"
      >
        + Add child
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="text-sm rounded-full border border-border px-4 py-1.5 text-danger hover:bg-surface-2 disabled:opacity-60"
      >
        Delete this profile
      </button>
    </div>
  );
}
