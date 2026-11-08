"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, json } from "@/src/lib/api";
import { Button, Card, PageHeader } from "@/src/components/shared/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Property = { id: string; name: string };
type Review = {
  id: string;
  propertyId: string;
  author: string;
  rating: number;
  comment: string;
  response: string;
  date: string;
};

export function ReviewsLive() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ properties: Property[] }>("/properties"),
      api<{ reviews: Review[] }>("/reviews"),
    ])
      .then(([propertyResult, reviewResult]) => {
        if (!active) return;
        setProperties(propertyResult.properties);
        setReviews(reviewResult.reviews);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load reviews",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const names = useMemo(
    () => new Map(properties.map((item) => [item.id, item.name])),
    [properties],
  );
  const ownReviews = useMemo(
    () => reviews.filter((item) => names.has(item.propertyId)),
    [reviews, names],
  );
  const visible = ownReviews.filter((item) =>
    `${item.author} ${names.get(item.propertyId)} ${item.comment}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const average = ownReviews.length
    ? (
        ownReviews.reduce((total, item) => total + item.rating, 0) /
        ownReviews.length
      ).toFixed(1)
    : "—";

  async function save(review: Review) {
    const response = (drafts[review.id] ?? review.response).trim();
    if (response.length < 2) {
      setError("Write at least two characters before posting.");
      return;
    }
    try {
      await api(`/reviews/${review.id}/response`, json("POST", { response }));
      setReviews((current) =>
        current.map((item) =>
          item.id === review.id ? { ...item, response } : item,
        ),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[review.id];
        return next;
      });
      setError("");
      toast.success("Public response saved");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save response",
      );
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Guest feedback"
        title="Reviews"
        description="Read guest feedback and publish responses through the local API."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm">Average rating</p>
          <p className="mt-2 text-2xl font-extrabold">{average} ★</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm">Total reviews</p>
          <p className="mt-2 text-2xl font-extrabold">{ownReviews.length}</p>
        </Card>
      </div>
      <Input
        className="form-input mb-5 max-w-md"
        aria-label="Search reviews"
        placeholder="Search reviews"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading reviews…</p>
      ) : visible.length === 0 ? (
        <Card className="p-6">No guest reviews found.</Card>
      ) : (
        <div className="space-y-4">
          {visible.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-extrabold">{review.author}</p>
                  <p className="text-sm text-[#756d66]">
                    {names.get(review.propertyId)} · {review.date.slice(0, 10)}
                  </p>
                </div>
                <span className="font-bold text-[#a87430]">
                  {review.rating} ★
                </span>
              </div>
              <p className="my-4">{review.comment}</p>
              <label
                className="block text-sm font-bold"
                htmlFor={`response-${review.id}`}
              >
                Your public response
              </label>
              <Textarea
                id={`response-${review.id}`}
                className="form-input mt-2 min-h-20"
                maxLength={2000}
                value={drafts[review.id] ?? review.response}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [review.id]: event.target.value,
                  }))
                }
              />
              <Button className="mt-3" size="sm" onClick={() => save(review)}>
                Save response
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
