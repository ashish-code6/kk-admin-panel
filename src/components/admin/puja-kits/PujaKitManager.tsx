"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  deleteAdminPujaKit,
  getAdminPujaKits,
  saveAdminPujaKit,
  uploadAdminPujaKitGalleryImage,
  uploadAdminPujaKitImage,
} from "@/lib/admin-api";
import type { AdminPujaKit, PujaKitItem } from "@/types/admin";

type KitDraft = Omit<AdminPujaKit, "id" | "imagePublicId"> & { id?: string };

const emptyDraft: KitDraft = {
  name: "",
  description: "",
  includes: "",
  kitItems: [],
  price: 1,
  originalPrice: null,
  rating: null,
  reviewCount: null,
  tag: "",
  deliveryInfo: "",
  imageUrl: "",
  galleryImages: [],
  sortOrder: 0,
  isActive: true,
};

type PujaKitManagerProps = {
  token: string;
};

function sortedKits(kits: AdminPujaKit[]) {
  return [...kits].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
  );
}

export default function PujaKitManager({ token }: PujaKitManagerProps) {
  const [kits, setKits] = useState<AdminPujaKit[]>([]);
  const [draft, setDraft] = useState<KitDraft>(emptyDraft);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return;
    }
    const preview = URL.createObjectURL(selectedImage);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [selectedImage]);

  useEffect(() => {
    let active = true;
    getAdminPujaKits(token)
      .then((result) => {
        if (active) setKits(sortedKits(result));
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load puja kits.",
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

  function startEdit(kit: AdminPujaKit) {
    setDraft({
      id: kit.id,
      name: kit.name,
      description: kit.description,
      includes: kit.includes,
      kitItems: kit.kitItems.map((kitItem) => ({ ...kitItem })),
      price: kit.price,
      originalPrice: kit.originalPrice,
      rating: kit.rating,
      reviewCount: kit.reviewCount,
      tag: kit.tag,
      deliveryInfo: kit.deliveryInfo,
      imageUrl: kit.imageUrl,
      galleryImages: kit.galleryImages,
      sortOrder: kit.sortOrder,
      isActive: kit.isActive,
    });
    setSelectedImage(null);
    setSelectedGalleryImages([]);
    setError("");
    setNotice("");
  }

  function resetForm() {
    setDraft(emptyDraft);
    setSelectedImage(null);
    setSelectedGalleryImages([]);
    setError("");
    setNotice("");
  }

  function updateDraft<K extends keyof KitDraft>(key: K, value: KitDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setNotice("");
  }

  function updateKitItem(index: number, key: keyof PujaKitItem, value: string) {
    setDraft((current) => ({
      ...current,
      kitItems: current.kitItems.map((kitItem, itemIndex) =>
        itemIndex === index ? { ...kitItem, [key]: value } : kitItem,
      ),
    }));
    setNotice("");
  }

  function addKitItem() {
    if (draft.kitItems.length >= 30) {
      setError("A kit can have up to 30 item rows.");
      return;
    }
    setError("");
    updateDraft("kitItems", [...draft.kitItems, { item: "", quantity: "" }]);
  }

  function removeKitItem(index: number) {
    updateDraft(
      "kitItems",
      draft.kitItems.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
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
    setSelectedImage(image);
  }

  function chooseGalleryImages(event: ChangeEvent<HTMLInputElement>) {
    const images = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (draft.galleryImages.length + selectedGalleryImages.length + images.length > 5) {
      setError("A kit can have up to 5 gallery images.");
      return;
    }
    if (images.some((image) => image.size > 5 * 1024 * 1024)) {
      setError("Each gallery image must be 5 MB or smaller.");
      return;
    }
    if (images.some((image) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type))) {
      setError("Choose JPEG, PNG, WebP, or GIF gallery images.");
      return;
    }
    setError("");
    setNotice("");
    setSelectedGalleryImages((current) => [...current, ...images]);
  }

  async function submitKit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const imageToUpload = selectedImage;
    if (!draft.id && !imageToUpload) {
      setError("Choose a kit image to upload to Cloudinary before creating the kit.");
      return;
    }
    if (draft.id && !draft.imageUrl && !imageToUpload) {
      setError("Choose a kit image to upload to Cloudinary before saving.");
      return;
    }
    const galleryImagesToUpload = selectedGalleryImages;
    const kitPayload = {
      ...draft,
      includes: draft.kitItems.map(({ item }) => item.trim()).filter(Boolean).join(", ").slice(0, 500),
    };
    setIsSaving(true);
    try {
      if (draft.id) {
        const publishAfterImageUpload = draft.isActive;
        const hasImageChanges = Boolean(imageToUpload || galleryImagesToUpload.length);
        let saved = await saveAdminPujaKit(token, {
          ...kitPayload,
          isActive: hasImageChanges ? false : draft.isActive,
        });
        setKits((current) =>
          sortedKits(current.map((kit) => (kit.id === saved.id ? saved : kit))),
        );
        if (imageToUpload) {
          saved = await uploadAdminPujaKitImage(token, saved.id, imageToUpload);
          setKits((current) =>
            sortedKits(current.map((kit) => (kit.id === saved.id ? saved : kit))),
          );
        }
        for (const galleryImage of galleryImagesToUpload) {
          saved = await uploadAdminPujaKitGalleryImage(token, saved.id, galleryImage);
          setKits((current) =>
            sortedKits(current.map((kit) => (kit.id === saved.id ? saved : kit))),
          );
        }
        if (hasImageChanges) {
          saved = await saveAdminPujaKit(token, {
            ...kitPayload,
            imageUrl: saved.imageUrl,
            galleryImages: saved.galleryImages,
            isActive: publishAfterImageUpload,
          });
          setKits((current) =>
            sortedKits(current.map((kit) => (kit.id === saved.id ? saved : kit))),
          );
        }
        setDraft(emptyDraft);
        setSelectedImage(null);
        setSelectedGalleryImages([]);
        setNotice("Puja kit changes saved and published.");
      } else {
        if (!imageToUpload) {
          setError("Choose a kit image to upload to Cloudinary before creating the kit.");
          return;
        }
        const saved = await saveAdminPujaKit(token, {
          ...kitPayload,
          imageUrl: null,
          galleryImages: [],
          isActive: false,
        });
        setKits((current) => sortedKits([...current, saved]));
        setDraft({ ...draft, id: saved.id, imageUrl: null });
        try {
          const uploaded = await uploadAdminPujaKitImage(
            token,
            saved.id,
            imageToUpload,
          );
          let latest = uploaded;
          for (const galleryImage of galleryImagesToUpload) {
            latest = await uploadAdminPujaKitGalleryImage(
              token,
              saved.id,
              galleryImage,
            );
          }
          const published = await saveAdminPujaKit(token, {
            ...kitPayload,
            id: saved.id,
            imageUrl: latest.imageUrl,
            galleryImages: latest.galleryImages,
          });
          setKits((current) =>
            sortedKits(
              current.map((kit) =>
                kit.id === published.id ? published : kit,
              ),
            ),
          );
          setDraft(emptyDraft);
          setSelectedImage(null);
          setSelectedGalleryImages([]);
          setNotice("Puja kit image uploaded to Cloudinary and kit published.");
        } catch (uploadError) {
          setError(
            `Kit saved as hidden, but its image could not be uploaded or published: ${
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown upload error."
            } Choose the image again and save to retry.`,
          );
        }
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save puja kit.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeKit(kit: AdminPujaKit) {
    if (!window.confirm(`Delete "${kit.name}"? This cannot be undone.`)) return;
    setError("");
    setNotice("");
    setDeletingId(kit.id);
    try {
      await deleteAdminPujaKit(token, kit.id);
      setKits((current) => current.filter((item) => item.id !== kit.id));
      if (draft.id === kit.id) {
        setDraft(emptyDraft);
        setSelectedImage(null);
        setSelectedGalleryImages([]);
      }
      setNotice("Puja kit deleted.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete puja kit.",
      );
    } finally {
      setDeletingId("");
    }
  }

  if (isLoading) {
    return <div className="puja-kit-manager-state">Loading puja kits…</div>;
  }

  return (
    <section className="puja-kit-manager" aria-label="Puja kit management">
      <div className="puja-kit-manager-intro">
        <div>
          <span className="overline">STORE CATALOG</span>
          <h2>Puja Kits</h2>
          <p>Manage kit details, prices, images, visibility, and storefront order.</p>
        </div>
        <span className="category-count">{kits.length} kits</span>
      </div>

      {error && <p className="category-manager-error" role="alert">{error}</p>}
      {notice && <p className="category-manager-notice" role="status">{notice}</p>}

      <div className="puja-kit-manager-grid">
        <form className="category-editor" onSubmit={submitKit}>
          <div className="category-editor-heading">
            <h3>{draft.id ? "Edit puja kit" : "Add a puja kit"}</h3>
            {draft.id && (
              <button type="button" className="category-reset" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

          <label className="category-field">
            <span>Kit name</span>
            <input
              value={draft.name}
              minLength={2}
              maxLength={100}
              required
              onChange={(event) => updateDraft("name", event.target.value)}
            />
          </label>
          <label className="category-field">
            <span>Short description</span>
            <input
              value={draft.description}
              maxLength={200}
              required
              onChange={(event) => updateDraft("description", event.target.value)}
            />
          </label>
          <div className="puja-kit-items-editor">
            <div className="puja-kit-items-heading">
              <div>
                <strong>Items &amp; quantities</strong>
                <small>Shown as a table in the storefront popup.</small>
              </div>
              <button type="button" onClick={addKitItem}>Add item</button>
            </div>
            <table className="puja-kit-items-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {draft.kitItems.length === 0 ? (
                  <tr>
                    <td className="puja-kit-items-empty" colSpan={3}>
                      No items yet. Select “Add item” to enter the kit contents.
                    </td>
                  </tr>
                ) : (
                  draft.kitItems.map((kitItem, index) => (
                    <tr key={`kit-item-${index}`}>
                      <td>
                        <input
                          value={kitItem.item}
                          maxLength={100}
                          placeholder="Item name"
                          required
                          aria-label={`Kit item ${index + 1}`}
                          onChange={(event) => updateKitItem(index, "item", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={kitItem.quantity}
                          maxLength={60}
                          placeholder="Quantity"
                          required
                          aria-label={`Quantity for kit item ${index + 1}`}
                          onChange={(event) =>
                            updateKitItem(index, "quantity", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          aria-label={`Remove ${kitItem.item || `item ${index + 1}`}`}
                          onClick={() => removeKitItem(index)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="category-field-row">
            <label className="category-field">
              <span>Price (₹)</span>
              <input
                type="number"
                min={1}
                max={10000000}
                step={1}
                value={draft.price}
                required
                onChange={(event) => updateDraft("price", Number(event.target.value))}
              />
            </label>
            <label className="category-field">
              <span>Original price (optional)</span>
              <input
                type="number"
                min={1}
                max={10000000}
                step={1}
                value={draft.originalPrice ?? ""}
                onChange={(event) =>
                  updateDraft(
                    "originalPrice",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              />
            </label>
          </div>
          <div className="category-field-row">
            <label className="category-field">
              <span>Rating (optional)</span>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={draft.rating ?? ""}
                onChange={(event) =>
                  updateDraft("rating", event.target.value ? Number(event.target.value) : null)
                }
              />
            </label>
            <label className="category-field">
              <span>Review count (optional)</span>
              <input
                type="number"
                min={0}
                max={10000000}
                step={1}
                value={draft.reviewCount ?? ""}
                onChange={(event) =>
                  updateDraft(
                    "reviewCount",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              />
            </label>
          </div>
          <div className="category-field-row">
            <label className="category-field">
              <span>Badge</span>
              <input
                value={draft.tag}
                maxLength={40}
                placeholder="e.g. Best Seller"
                onChange={(event) => updateDraft("tag", event.target.value)}
              />
            </label>
            <label className="category-field">
              <span>Delivery message</span>
              <input
                value={draft.deliveryInfo}
                maxLength={160}
                placeholder="e.g. Delivery in 1–2 days"
                onChange={(event) => updateDraft("deliveryInfo", event.target.value)}
              />
            </label>
          </div>
          <div className="puja-kit-image-control">
            {(imagePreview || draft.imageUrl) && (
              <img src={imagePreview || draft.imageUrl || ""} alt="Kit preview" />
            )}
            <label className="banner-upload-button">
              {selectedImage ? "Choose a different image" : "Choose kit image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="Upload puja kit image to Cloudinary"
                onChange={chooseImage}
              />
            </label>
            <small>
              {selectedImage
                ? `${selectedImage.name} · Uploads to Cloudinary when you save`
                : "Select a JPEG, PNG, WebP, or GIF · Up to 5 MB"}
            </small>
          </div>
          <div className="puja-kit-image-control">
            <label className="banner-upload-button">
              Add gallery images
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="Upload puja kit gallery images to Cloudinary"
                multiple
                onChange={chooseGalleryImages}
              />
            </label>
            <small>Up to 5 additional images · Each image up to 5 MB</small>
            {(draft.galleryImages.length > 0 || selectedGalleryImages.length > 0) && (
              <div className="puja-kit-gallery-editor">
                {draft.galleryImages.map((url, index) => (
                  <div className="puja-kit-gallery-item" key={`${url}-${index}`}>
                    <img src={url} alt={`Gallery image ${index + 1}`} />
                    <button
                      type="button"
                      aria-label={`Remove gallery image ${index + 1}`}
                      onClick={() =>
                        updateDraft(
                          "galleryImages",
                          draft.galleryImages.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                {selectedGalleryImages.map((image, index) => (
                  <div className="puja-kit-gallery-pending" key={`${image.name}-${index}`}>
                    <span>{image.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove selected gallery image ${image.name}`}
                      onClick={() =>
                        setSelectedGalleryImages((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="category-field-row">
            <label className="category-field">
              <span>Display order</span>
              <input
                type="number"
                min={0}
                max={9999}
                step={1}
                value={draft.sortOrder}
                required
                onChange={(event) => updateDraft("sortOrder", Number(event.target.value))}
              />
            </label>
            <label className="puja-kit-active-toggle">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(event) => updateDraft("isActive", event.target.checked)}
              />
              <span>Visible in storefront</span>
            </label>
          </div>
          <button type="submit" className="category-save-button" disabled={isSaving}>
            {isSaving
              ? "Uploading and saving…"
              : draft.id
                ? selectedImage
                  ? "Upload image & save changes"
                  : "Save changes"
                : "Upload image & create kit"}
          </button>
        </form>

        <div className="puja-kit-list-panel">
          <div className="category-tree-heading">
            <h3>Your kits</h3>
            <span>Sorted by display order</span>
          </div>
          {kits.length === 0 ? (
            <div className="category-empty">No kits yet. Add one using the form.</div>
          ) : (
            <div className="puja-kit-list">
              {kits.map((kit) => (
                <article className="puja-kit-list-row" key={kit.id}>
                  {kit.imageUrl ? (
                    <img src={kit.imageUrl} alt="" />
                  ) : (
                    <span className="puja-kit-no-image">No image</span>
                  )}
                  <div className="puja-kit-list-copy">
                    <strong>{kit.name}</strong>
                    <small>₹{kit.price} · Order {kit.sortOrder} · {kit.isActive ? "Published" : "Hidden"}</small>
                  </div>
                  <button type="button" onClick={() => startEdit(kit)}>Edit</button>
                  <button
                    type="button"
                    className="puja-kit-delete"
                    disabled={deletingId === kit.id}
                    onClick={() => void removeKit(kit)}
                  >
                    {deletingId === kit.id ? "Deleting…" : "Delete"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
