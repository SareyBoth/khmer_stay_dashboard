"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, json } from "@/src/lib/api";
import { Button, Card, PageHeader } from "@/src/components/shared/ui";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";

const POPULAR_AMENITIES: MultiSelectOption[] = [
  { value: "Wi-Fi", label: "Wi-Fi" },
  { value: "Air Conditioning", label: "Air Conditioning" },
  { value: "Breakfast", label: "Breakfast Included" },
  { value: "Swimming Pool", label: "Swimming Pool" },
  { value: "Free Parking", label: "Free Parking" },
  { value: "River View", label: "River View" },
  { value: "Bicycle Rental", label: "Bicycle Rental" },
  { value: "Khmer Cooking Class", label: "Khmer Cooking Class" },
  { value: "Airport Shuttle", label: "Airport Shuttle" },
  { value: "Kitchenette", label: "Kitchen / Kitchenette" },
  { value: "Balcony", label: "Balcony / Terrace" },
  { value: "Garden", label: "Garden & Patio" },
];

type Room = {
  id: string;
  name: string;
  nameKm: string;
  bed: string;
  guests: number;
  price: number;
  inventory: number;
};
type Property = {
  id: string;
  name: string;
  nameKm: string;
  province: string;
  provinceKm: string;
  provinceCode: string;
  city: string;
  cityKm: string;
  cityId: string;
  type: string;
  description: string;
  descriptionKm: string;
  category: string;
  amenities: string[];
  image: string;
  roomTypes: Room[];
};
type City = { id: string; provinceCode: string; name: string; nameKm: string; type: string };
type Province = { code: string; name: string; nameKm: string; cities: City[] };

const newRoom: Room = {
  id: "",
  name: "Standard room",
  nameKm: "បន្ទប់ស្តង់ដារ",
  bed: "1 king bed",
  guests: 2,
  price: 35,
  inventory: 1,
};
const blank: Property = {
  id: "",
  name: "",
  nameKm: "",
  province: "",
  provinceKm: "",
  provinceCode: "",
  city: "",
  cityKm: "",
  cityId: "",
  type: "Guesthouse",
  description: "",
  descriptionKm: "",
  category: "Guesthouse",
  amenities: [],
  image: "",
  roomTypes: [newRoom],
};

export function PropertyEditorLive({ propertyId }: { propertyId?: string }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property>(blank);
  const [amenitiesText, setAmenitiesText] = useState("");
  const [loading, setLoading] = useState(Boolean(propertyId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    let active = true;
    api<{ provinces: Province[] }>("/locations/provinces")
      .then(({ provinces }) => {
        if (active) setProvinces(provinces);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load Cambodia locations",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    let active = true;
    api<{ property: Property }>(`/properties/${propertyId}`)
      .then(({ property }) => {
        if (active) {
          setProperty(property);
          setAmenitiesText(property.amenities.join(", "));
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load property",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [propertyId]);

  function field(key: keyof Property, value: string) {
    setProperty((current) => ({ ...current, [key]: value }));
  }

  function selectProvince(provinceCode: string) {
    const province = provinces.find((item) => item.code === provinceCode);
    setProperty((current) => ({
      ...current,
      provinceCode,
      province: province?.name ?? "",
      provinceKm: province?.nameKm ?? "",
      cityId: "",
      city: "",
      cityKm: "",
    }));
  }

  function selectCity(cityId: string) {
    const province = provinces.find((item) => item.code === property.provinceCode);
    const city = province?.cities.find((item) => item.id === cityId);
    setProperty((current) => ({
      ...current,
      cityId,
      city: city?.name ?? "",
      cityKm: city?.nameKm ?? "",
    }));
  }

  function roomField(key: keyof Room, value: string) {
    setProperty((current) => ({
      ...current,
      roomTypes: current.roomTypes.map((room, index) =>
        index === 0
          ? {
              ...room,
              [key]: ["guests", "price", "inventory"].includes(key)
                ? Number(value)
                : value,
            }
          : room,
      ),
    }));
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ url: string }>("/uploads", {
        method: "POST",
        body: form,
      });
      field("image", result.url);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not upload photo",
      );
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const room = property.roomTypes[0];
    if (
      !property.name.trim() ||
      !property.provinceCode ||
      !property.cityId ||
      !room.name.trim() ||
      room.price <= 0 ||
      room.inventory < 1 ||
      room.guests < 1
    ) {
      setError("Add a name, Cambodia province, city and valid first room before saving.");
      return;
    }
    setSaving(true);
    const body = {
      name: property.name,
      nameKm: property.nameKm,
      province: property.province,
      provinceKm: property.provinceKm,
      provinceCode: property.provinceCode,
      city: property.city,
      cityKm: property.cityKm,
      cityId: property.cityId,
      type: property.type,
      category: property.category,
      description: property.description,
      descriptionKm: property.descriptionKm,
      image: property.image,
      roomTypes: property.roomTypes,
      amenities: amenitiesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      if (propertyId) {
        await api(`/properties/${propertyId}`, json("PATCH", body));
      } else {
        const created = await api<{ property: Property }>(
          "/properties",
          json("POST", body),
        );
        await api(
          `/properties/${created.property.id}/status`,
          json("POST", { status: "Review pending" }),
        );
      }
      router.push("/owner/properties");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save property",
      );
      setSaving(false);
    }
  }

  const room = property.roomTypes[0] ?? newRoom;
  return (
    <div>
      <PageHeader
        eyebrow="Properties"
        title={propertyId ? "Edit property" : "Add property"}
        description="These details are stored on the local Go API."
      />
      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading property…</p>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              English name
              <Input
                required
                minLength={3}
                className="form-input mt-2"
                value={property.name}
                onChange={(event) => field("name", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Khmer name
              <Input
                className="form-input mt-2"
                value={property.nameKm}
                onChange={(event) => field("nameKm", event.target.value)}
              />
            </label>
            <div className="block text-sm font-bold">
              <span className="block mb-2">Province</span>
              <Select
                value={property.provinceCode || undefined}
                onValueChange={(val) => selectProvince(val)}
              >
                <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                  <SelectValue placeholder="Choose a province or capital" />
                </SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl border-[#dfd2bf] bg-white">
                  {provinces.map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name} · {province.nameKm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="block text-sm font-bold">
              <span className="block mb-2">City / municipality</span>
              <Select
                value={property.cityId || undefined}
                disabled={!property.provinceCode}
                onValueChange={(val) => selectCity(val)}
              >
                <SelectTrigger className="form-input min-h-10 w-full rounded-xl bg-white text-sm font-semibold">
                  <SelectValue placeholder="Choose a city" />
                </SelectTrigger>
                <SelectContent className="max-h-64 rounded-xl border-[#dfd2bf] bg-white">
                  {(provinces.find((item) => item.code === property.provinceCode)?.cities ?? []).map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name} · {city.nameKm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="block text-sm font-bold">
              Property type
              <Input
                className="form-input mt-2"
                value={property.type}
                onChange={(event) => field("type", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Category
              <Input
                className="form-input mt-2"
                value={property.category}
                onChange={(event) => field("category", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold sm:col-span-2">
              English description
              <Textarea
                className="form-input mt-2 min-h-28"
                value={property.description}
                onChange={(event) => field("description", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold sm:col-span-2">
              Khmer description
              <Textarea
                className="form-input mt-2 min-h-28"
                value={property.descriptionKm}
                onChange={(event) => field("descriptionKm", event.target.value)}
              />
            </label>
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm font-bold">
                Amenities & features
              </label>
              <MultiSelect
                options={POPULAR_AMENITIES}
                selected={amenitiesText ? amenitiesText.split(",").map((s) => s.trim()).filter(Boolean) : []}
                onChange={(selected) => setAmenitiesText(selected.join(", "))}
                placeholder="Select property amenities…"
              />
              <Input
                className="form-input mt-1.5"
                value={amenitiesText}
                onChange={(event) => setAmenitiesText(event.target.value)}
                placeholder="Or type custom amenities separated by commas..."
              />
            </div>
            <label className="block text-sm font-bold sm:col-span-2">
              Property photo
              <Input
                className="form-input mt-2"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <span className="mt-1 block text-xs font-normal">
                {uploading
                  ? "Uploading…"
                  : property.image
                    ? `Current photo: ${property.image.split("/").at(-1)}`
                    : "PNG, JPEG or WebP, up to 8 MB"}
              </span>
            </label>
          </Card>
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <h2 className="text-lg font-extrabold">First room</h2>
              <p className="text-sm text-[#756d66]">
                Manage additional rooms from the room page after saving.
              </p>
            </div>
            <label className="block text-sm font-bold">
              Room name
              <Input
                required
                className="form-input mt-2"
                value={room.name}
                onChange={(event) => roomField("name", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Room name in Khmer
              <Input
                className="form-input mt-2"
                value={room.nameKm}
                onChange={(event) => roomField("nameKm", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Bed description
              <Input
                className="form-input mt-2"
                value={room.bed}
                onChange={(event) => roomField("bed", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Guests
              <Input
                required
                type="number"
                min={1}
                max={20}
                className="form-input mt-2"
                value={room.guests}
                onChange={(event) => roomField("guests", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Price per night (USD)
              <Input
                required
                type="number"
                min={1}
                step="0.01"
                className="form-input mt-2"
                value={room.price}
                onChange={(event) => roomField("price", event.target.value)}
              />
            </label>
            <label className="block text-sm font-bold">
              Available rooms
              <Input
                required
                type="number"
                min={1}
                className="form-input mt-2"
                value={room.inventory}
                onChange={(event) => roomField("inventory", event.target.value)}
              />
            </label>
          </Card>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving || uploading}>
              {saving
                ? "Saving…"
                : propertyId
                  ? "Save changes"
                  : "Submit for review"}
            </Button>
            <Link href="/owner/properties">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
