"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  deleteAdminCategory,
  getAdminCategories,
  saveAdminCategory,
  uploadAdminCategoryImage,
} from "@/lib/admin-api";
import type { AdminCategory } from "@/types/admin";

type CategoryDraft = {
  id?: string;
  name: string;
  isActive: boolean;
};

const emptyDraft: CategoryDraft = {
  name: "",
  isActive: true,
};

type CategoryManagerProps = {
  token: string;
};

export default function CategoryManager({ token }: CategoryManagerProps) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [draft, setDraft] = useState<CategoryDraft>(emptyDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const editingCategory = categories.find(
    (category) => category.id === draft.id,
  );
  const childrenByParent = new Map<string, AdminCategory[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const children = childrenByParent.get(category.parentId) ?? [];
    children.push(category);
    childrenByParent.set(category.parentId, children);
  }
  const rootCategories = categories.filter(
    (category) => category.parentId === null,
  );

  async function loadCategories() {
    setError("");
    try {
      setCategories(await getAdminCategories(token));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load categories.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, [token]);

  function startEdit(category: AdminCategory) {
    setDraft({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    });
    setError("");
    setNotice("");
  }

  function resetForm() {
    setDraft(emptyDraft);
    setError("");
    setNotice("");
  }

  async function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      const saved = await saveAdminCategory(token, {
        id: draft.id,
        name: draft.name,
        sortOrder:
          editingCategory?.sortOrder ??
          categories.reduce(
            (highest, category) => Math.max(highest, category.sortOrder),
            -1,
          ) + 1,
        isActive: draft.isActive,
        parentId: editingCategory?.parentId ?? null,
      });
      setCategories((current) => {
        const existing = current.some((item) => item.id === saved.id);
        return existing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved];
      });
      setNotice(draft.id ? "Category updated." : "Category created. Select Edit to upload its image.");
      setDraft(emptyDraft);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save category.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadImage(
    categoryId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
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
    setUploadingId(categoryId);
    try {
      const saved = await uploadAdminCategoryImage(token, categoryId, image);
      setCategories((current) =>
        current.map((category) => (category.id === saved.id ? saved : category)),
      );
      setNotice(`Image for "${saved.name}" updated.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload category image.",
      );
    } finally {
      setUploadingId("");
    }
  }

  async function removeCategory(category: AdminCategory) {
    if (
      !window.confirm(
        `Delete "${category.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError("");
    setNotice("");
    setDeletingId(category.id);
    try {
      await deleteAdminCategory(token, category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      if (draft.id === category.id) setDraft(emptyDraft);
      setNotice("Category deleted.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete category.",
      );
    } finally {
      setDeletingId("");
    }
  }

  if (isLoading) {
    return <div className="category-manager-state">Loading categories…</div>;
  }

  return (
    <section className="category-manager" aria-label="Category management">
      <div className="category-manager-intro">
        <div>
          <span className="overline">STORE CATALOG</span>
          <h2>Shop by Category</h2>
          <p>Manage category names, images, and storefront visibility.</p>
        </div>
        <span className="category-count">{categories.length} categories</span>
      </div>

      {error && <p className="category-manager-error" role="alert">{error}</p>}
      {notice && <p className="category-manager-notice" role="status">{notice}</p>}

      <div className="category-manager-grid">
        <form className="category-editor" onSubmit={submitCategory}>
          <div className="category-editor-heading">
            <h3>{draft.id ? "Edit category" : "Add a category"}</h3>
            {draft.id && (
              <button type="button" className="category-reset" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

          <label className="category-field">
            <span>Category name</span>
            <input
              value={draft.name}
              maxLength={60}
              minLength={2}
              required
              placeholder="e.g. Puja Kits"
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label className="category-visible-toggle">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            <span>Visible in Shop by Category</span>
          </label>

          <button type="submit" className="category-save-button" disabled={isSaving}>
            {isSaving ? "Saving…" : draft.id ? "Save changes" : "Create category"}
          </button>
        </form>

        <div className="category-tree-panel">
          <div className="category-tree-heading">
            <h3>Your categories</h3>
            <span>Shown in the storefront</span>
          </div>
          {rootCategories.length === 0 ? (
            <p className="category-empty">No categories yet. Add one to get started.</p>
          ) : (
            <div className="category-tree">
              {rootCategories.map((parent) => (
                <div className="category-tree-group" key={parent.id}>
                  <CategoryRow
                    category={parent}
                    depth={0}
                    deletingId={deletingId}
                    uploadingId={uploadingId}
                    onUploadImage={uploadImage}
                    onEdit={startEdit}
                    onDelete={removeCategory}
                  />
                  {(childrenByParent.get(parent.id) ?? []).map((child) => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      depth={1}
                      deletingId={deletingId}
                      uploadingId={uploadingId}
                      onUploadImage={uploadImage}
                      onEdit={startEdit}
                      onDelete={removeCategory}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryRow({
  category,
  depth,
  deletingId,
  uploadingId,
  onUploadImage,
  onEdit,
  onDelete,
}: {
  category: AdminCategory;
  depth: 0 | 1;
  deletingId: string;
  uploadingId: string;
  onUploadImage: (
    categoryId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
}) {
  return (
    <div className={`category-tree-row${depth ? " category-tree-child" : ""}`}>
      <span className="category-tree-icon">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt="" />
        ) : (
          <span className="category-image-placeholder" aria-hidden="true" />
        )}
      </span>
      <span className="category-tree-name">
        <strong>{category.name}</strong>
        <small>
          {depth ? "Subcategory" : `${category._count.children} subcategories`}
          {!category.isActive && " · Hidden"}
        </small>
      </span>
      <span className={category.isActive ? "category-status" : "category-status category-hidden"}>
        {category.isActive ? "Visible" : "Hidden"}
      </span>
      <label className="category-row-upload">
        {uploadingId === category.id
          ? "Uploading…"
          : category.imageUrl
            ? "Change image"
            : "Add image"}
        <input
          aria-label={`${category.imageUrl ? "Change" : "Add"} image for ${category.name}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={uploadingId !== "" || deletingId === category.id}
          onChange={(event) => onUploadImage(category.id, event)}
        />
      </label>
      <button type="button" onClick={() => onEdit(category)}>Edit</button>
      <button
        type="button"
        disabled={deletingId === category.id}
        onClick={() => void onDelete(category)}
      >
        {deletingId === category.id ? "…" : "Delete"}
      </button>
    </div>
  );
}
