"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  getAdminBanners,
  updateAdminBanner,
  uploadAdminBannerImage,
} from "@/lib/admin-api";
import type { AdminBanner } from "@/types/admin";

type BannerDraft = Pick<
  AdminBanner,
  | "eyebrow"
  | "title"
  | "subtitle"
  | "caption"
  | "ctaLabel"
  | "ctaHref"
  | "isActive"
>;

const editableFields: {
  key: keyof Omit<BannerDraft, "isActive">;
  label: string;
  maxLength: number;
  multiline?: boolean;
}[] = [
  { key: "eyebrow", label: "Eyebrow", maxLength: 80 },
  { key: "title", label: "Headline", maxLength: 120, multiline: true },
  { key: "subtitle", label: "Supporting text", maxLength: 180, multiline: true },
  { key: "caption", label: "Image caption", maxLength: 120 },
  { key: "ctaLabel", label: "Button label", maxLength: 40 },
  { key: "ctaHref", label: "Button link (e.g. #products or /products)", maxLength: 300 },
];

type BannerManagerProps = {
  token: string;
};

export default function BannerManager({ token }: BannerManagerProps) {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [draft, setDraft] = useState<BannerDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    getAdminBanners(token)
      .then((result) => {
        if (!active) return;
        setBanners(result);
        const firstBanner = result.find((banner) => banner.slot === 1);
        if (firstBanner) setDraft(toDraft(firstBanner));
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load homepage banners.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const selectedBanner = banners.find(
    (banner) => banner.slot === selectedSlot,
  );

  function chooseSlot(slot: number) {
    setSelectedSlot(slot);
    const banner = banners.find((item) => item.slot === slot);
    setDraft(banner ? toDraft(banner) : null);
    setError("");
    setNotice("");
  }

  function updateDraft<K extends keyof BannerDraft>(
    key: K,
    value: BannerDraft[K],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setNotice("");
  }

  async function saveBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      const saved = await updateAdminBanner(token, selectedSlot, draft);
      setBanners((current) =>
        current.map((banner) => (banner.slot === saved.slot ? saved : banner)),
      );
      setDraft(toDraft(saved));
      setNotice("Banner changes saved and published.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save banner changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];
    event.target.value = "";
    if (!image) return;
    if (image.size > 5 * 1024 * 1024) {
      setError("Choose an image that is 5 MB or smaller.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }

    setError("");
    setNotice("");
    setIsUploading(true);
    try {
      const saved = await uploadAdminBannerImage(token, selectedSlot, image);
      setBanners((current) =>
        current.map((banner) => (banner.slot === saved.slot ? saved : banner)),
      );
      setDraft(toDraft(saved));
      setNotice("Banner image uploaded and published.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload banner image.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return <div className="banner-manager-state">Loading homepage banners…</div>;
  }
  if (banners.length !== 2 || !draft || !selectedBanner) {
    return (
      <div className="banner-manager-state" role="alert">
        {error || "Two homepage banner slots are required. Apply the backend database migration and reload."}
      </div>
    );
  }

  return (
    <section className="banner-manager" aria-label="Homepage banner editor">
      <div className="banner-slot-list" role="tablist" aria-label="Choose banner">
        {[1, 2].map((slot) => {
          const banner = banners.find((item) => item.slot === slot);
          if (!banner) return null;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={selectedSlot === slot}
              className={selectedSlot === slot ? "banner-slot active" : "banner-slot"}
              key={slot}
              onClick={() => chooseSlot(slot)}
            >
              <span className="banner-slot-image" style={{ backgroundImage: `url("${banner.imageUrl}")` }} />
              <span>
                <strong>Banner {slot}</strong>
                <small>{banner.isActive ? "Published" : "Hidden"} · {banner.title}</small>
              </span>
            </button>
          );
        })}
      </div>

      <form className="banner-editor" onSubmit={saveBanner}>
        <div className="banner-editor-heading">
          <div>
            <span className="overline">HOMEPAGE CAROUSEL</span>
            <h2>Edit banner {selectedSlot}</h2>
            <p>Changes are published immediately to the storefront.</p>
          </div>
          <label className="banner-publish-toggle">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) => updateDraft("isActive", event.target.checked)}
            />
            <span>Show on homepage</span>
          </label>
        </div>

        <div className="banner-image-preview">
          <img
            src={selectedBanner.imageUrl}
            alt={`Full preview of homepage banner ${selectedSlot}`}
          />
        </div>
        <label className="banner-upload-button">
          {isUploading ? "Uploading image…" : "Choose and upload image"}
          <input
            aria-label={`Upload image for banner ${selectedSlot}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={isUploading}
            onChange={uploadImage}
          />
        </label>
        <small className="banner-upload-help">JPEG, PNG, WebP, or GIF · Up to 5 MB · Stored securely in Cloudinary</small>

        <div className="banner-fields">
          {editableFields.map((field) => (
            <label className="banner-field" key={field.key}>
              <span>{field.label}</span>
              {field.multiline ? (
                <textarea
                  value={draft[field.key]}
                  maxLength={field.maxLength}
                  required
                  rows={field.key === "title" ? 2 : 3}
                  onChange={(event) => updateDraft(field.key, event.target.value)}
                />
              ) : (
                <input
                  value={draft[field.key]}
                  maxLength={field.maxLength}
                  required
                  onChange={(event) => updateDraft(field.key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>

        {error && <p className="banner-editor-error" role="alert">{error}</p>}
        {notice && <p className="banner-editor-notice" role="status">{notice}</p>}
        <div className="banner-editor-actions">
          <span>Slide {selectedSlot} of 2 · Auto-rotates every 5 seconds</span>
          <button type="submit" disabled={isSaving || isUploading}>
            {isSaving ? "Saving…" : "Save and publish"}
          </button>
        </div>
      </form>
    </section>
  );
}

function toDraft(banner: AdminBanner): BannerDraft {
  return {
    eyebrow: banner.eyebrow,
    title: banner.title,
    subtitle: banner.subtitle,
    caption: banner.caption,
    ctaLabel: banner.ctaLabel,
    ctaHref: banner.ctaHref,
    isActive: banner.isActive,
  };
}
