"use client";

import { useEffect, useState } from "react";
import { api, json } from "@/src/lib/api";
import { Button, Card, PageHeader } from "@/src/components/shared/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type Settings = {
  commission: number;
  maintenance: boolean;
  instantBooking: boolean;
  payouts: boolean;
};

export function SettingsLive() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ settings: Settings }>("/settings")
      .then(({ settings }) => {
        if (active) setSettings(settings);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load settings",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const result = await api<{ settings: Settings }>(
        "/settings",
        json("PATCH", settings),
      );
      setSettings(result.settings);
      setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save settings",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        description="These settings are stored by the local Go server."
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {!settings ? (
        <p>Loading settings…</p>
      ) : (
        <Card className="max-w-2xl p-5">
          <label className="block text-sm font-bold">
            Commission (%)
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="form-input mt-2"
              value={settings.commission}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  commission: Number(event.target.value),
                })
              }
            />
          </label>
          <div className="mt-6 space-y-3">
            {(
              [
                ["maintenance", "Maintenance banner"],
                ["instantBooking", "Instant booking display"],
                ["payouts", "Demo payout display"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-xl border border-[#e1d5c3] p-4 text-sm font-bold"
              >
                <span>{label}</span>
                <Checkbox
                  className="size-5 accent-[#9b6e31]"
                  checked={settings[key]}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, [key]: checked === true })
                  }
                />
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Button disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
            {saved && (
              <span role="status" className="text-sm text-green-700">
                Saved on the local server
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
