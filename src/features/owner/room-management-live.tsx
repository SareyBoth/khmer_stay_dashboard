"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { api, API_URL, json } from "@/src/lib/api";
import { useDemoStore } from "@/src/stores/demo-store";
import { Button, Card, PageHeader } from "@/src/components/shared/ui";
import { Input } from "@/components/ui/input";
import type { Property } from "@/src/types";

type Room = {
  id: string;
  name: string;
  nameKm: string;
  bed: string;
  guests: number;
  price: number;
  inventory: number;
};
type PropertyWithRooms = Property & { roomTypes: Room[] };

export function RoomManagementLive({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<PropertyWithRooms | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api<{ property: PropertyWithRooms }>(`/properties/${propertyId}`)
      .then(({ property }) => {
        if (active) {
          setProperty(property);
          setRooms(property.roomTypes);
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load rooms",
          );
      });
    return () => {
      active = false;
    };
  }, [propertyId]);

  function change(index: number, patch: Partial<Room>) {
    setRooms((current) =>
      current.map((room, i) => (i === index ? { ...room, ...patch } : room)),
    );
  }

  async function save() {
    if (
      !rooms.length ||
      rooms.some(
        (room) =>
          !room.name.trim() ||
          room.price <= 0 ||
          room.inventory < 1 ||
          room.guests < 1,
      )
    ) {
      setError(
        "Each room needs a name, price, guest limit and at least one available room.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { property: saved } = await api<{ property: PropertyWithRooms }>(
        `/properties/${propertyId}`,
        json("PATCH", { roomTypes: rooms }),
      );
      setProperty(saved);
      setRooms(saved.roomTypes);
      useDemoStore.setState((state) => ({
        properties: state.properties.map((item) =>
          item.id === propertyId
            ? { ...item, rooms: saved.roomTypes.length, price: saved.price }
            : item,
        ),
        prices: { ...state.prices, [propertyId]: saved.price },
      }));
      toast.success("Rooms saved to the local server");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save rooms");
    } finally {
      setBusy(false);
    }
  }

  const image = property?.image.startsWith("/uploads/")
    ? `${API_URL}${property.image}`
    : property?.image || "/images/siem-reap-homestay.png";
  return (
    <div>
      <PageHeader
        eyebrow="Owner properties"
        title={property ? `${property.name} · Rooms` : "Rooms"}
        description="Set room types, capacity, inventory and nightly price."
        actions={
          <Link href={`/owner/properties/${propertyId}`}>
            <Button variant="secondary">Back to property</Button>
          </Link>
        }
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {!property ? (
        <p>Loading rooms…</p>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            {rooms.map((room, index) => (
              <Card key={room.id} className="overflow-hidden">
                <div className="relative h-36">
                  <Image
                    src={image}
                    alt="Property"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  <label className="text-sm font-bold">
                    Room name
                    <Input
                      className="form-input mt-1"
                      value={room.name}
                      onChange={(event) =>
                        change(index, { name: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Khmer name
                    <Input
                      className="form-input mt-1"
                      value={room.nameKm}
                      onChange={(event) =>
                        change(index, { nameKm: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Bed
                    <Input
                      className="form-input mt-1"
                      value={room.bed}
                      onChange={(event) =>
                        change(index, { bed: event.target.value })
                      }
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Guests
                    <Input
                      type="number"
                      min="1"
                      className="form-input mt-1"
                      value={room.guests}
                      onChange={(event) =>
                        change(index, { guests: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Price USD
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      className="form-input mt-1"
                      value={room.price}
                      onChange={(event) =>
                        change(index, { price: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="text-sm font-bold">
                    Inventory
                    <Input
                      type="number"
                      min="1"
                      className="form-input mt-1"
                      value={room.inventory}
                      onChange={(event) =>
                        change(index, { inventory: Number(event.target.value) })
                      }
                    />
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={rooms.length === 1}
                    onClick={() =>
                      setRooms((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove room
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setRooms((current) => [
                  ...current,
                  {
                    id: `room-${Date.now()}`,
                    name: "New room",
                    nameKm: "បន្ទប់ថ្មី",
                    bed: "1 queen bed",
                    guests: 2,
                    price: 35,
                    inventory: 1,
                  },
                ])
              }
            >
              Add room
            </Button>
            <Button type="button" disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save rooms"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
