"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/admin/categories";
import type { CategoryWithCount } from "@/lib/data/admin/categories";

export type CategoriesManagerProps = {
  categories: ReadonlyArray<CategoryWithCount>;
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<CategoryWithCount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const create = () => {
    setCreateError(null);
    startTransition(async () => {
      const res = await createCategoryAction(newName);
      if (!res.ok) {
        setCreateError(res.error);
        return;
      }
      setNewName("");
      router.refresh();
    });
  };

  const saveEdit = (id: string) => {
    setEditError(null);
    startTransition(async () => {
      const res = await updateCategoryAction(id, editName);
      if (!res.ok) {
        setEditError(res.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteCategoryAction(toDelete.id);
      if (!res.ok) {
        setDeleteError(res.error);
        return;
      }
      setToDelete(null);
      router.refresh();
    });
  };

  return (
    <>
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Nueva categoría…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              aria-label="Nombre de la nueva categoría"
              onKeyDown={(e) => {
                if (e.key === "Enter") create();
              }}
            />
            {createError && (
              <div className="text-xs text-danger mt-1.5">{createError}</div>
            )}
          </div>
          <Button
            icon="plus"
            onClick={create}
            disabled={isPending || newName.trim() === ""}
          >
            Agregar
          </Button>
        </div>
      </Card>

      <Card padding={0}>
        <ul className="divide-y divide-line">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-3 px-5 py-3.5 flex-wrap"
            >
              {editingId === cat.id ? (
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex-1 min-w-0">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      aria-label={`Nuevo nombre para ${cat.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(cat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    {editError && (
                      <div className="text-xs text-danger mt-1.5">{editError}</div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      icon="check"
                      onClick={() => saveEdit(cat.id)}
                      disabled={isPending}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="flex-1 min-w-0 font-medium truncate">
                    {cat.name}
                  </span>
                  <Pill tone="neutral" size="sm">
                    {cat.productsCount}{" "}
                    {cat.productsCount === 1 ? "producto" : "productos"}
                  </Pill>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon="edit"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                        setEditError(null);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon="trash"
                      onClick={() => {
                        setToDelete(cat);
                        setDeleteError(null);
                      }}
                    >
                      Borrar
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-5 py-12 text-center text-ink-3 text-sm">
              No hay categorías. Agregá la primera arriba.
            </li>
          )}
        </ul>
      </Card>

      <ConfirmDialog
        open={toDelete !== null}
        tone="danger"
        title="Borrar categoría"
        description={
          <>
            ¿Borrar <strong>“{toDelete?.name}”</strong>? Solo se puede si no
            tiene productos asociados.
            {deleteError && (
              <div className="mt-3 px-3 py-2 rounded-r2 bg-danger/10 text-danger text-[13px]">
                {deleteError}
              </div>
            )}
          </>
        }
        confirmLabel="Borrar"
        pendingLabel="Borrando…"
        confirmIcon="trash"
        isPending={isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
