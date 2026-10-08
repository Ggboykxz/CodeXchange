"use client";

import { toast } from "sonner";
import { useT } from "@/store/app-store";
import { useFeedPrefsStore } from "@/store/feed-prefs-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  BookmarkCheck,
  EyeOff,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Share2,
  Trash2,
  ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Actions de gestion, affichées **uniquement** à l'auteur ou au staff. */
export interface ManagementActions {
  pinned: boolean;
  /** Auteur de la question connecté, ou membre du staff. */
  canManage: boolean;
  /** Seul le staff épingle (limite Reddit : 2 par forum). */
  canPin: boolean;
  onTogglePin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface PostActionsProps {
  threadId: string;
  /** Slug requis pour le lien de partage. */
  threadSlug: string;
  /** Compteur de réponses affiché à côté de l'icône de commentaire. */
  comments?: number;
  /** Ouvre la discussion — le « Commenter » de Reddit. */
  onOpen?: () => void;
  management?: ManagementActions;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Barre d'actions                                                     */
/* ------------------------------------------------------------------ */

/** Bouton d'action : icône + libellé (masqué sous `sm`) + compteur. */
function Action({
  icon: Icon,
  label,
  count,
  active,
  onClick,
  className,
}: {
  icon: typeof MessageSquare;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1",
        active && "text-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {/* Libellés masqués sous `sm` : la barre reste sur une ligne à 390 px. */}
      <span className="hidden sm:inline">{label}</span>
      {typeof count === "number" && (
        <span className="tabular-nums">{count}</span>
      )}
    </button>
  );
}

/**
 * Barre d'actions d'une publication — le modèle Reddit, transposé tel quel :
 * `💬 Commenter n · ↗ Partager · 🔖 Sauvegarder · ⋯`.
 *
 * « Partager » et « ⋯ » sont des menus (copier le lien, ouvrir dans un onglet,
 * masquer, puis les actions de gestion quand l'utilisateur y a droit) plutôt
 * que des boutons empilés : la barre tient sur une seule ligne, y compris à
 * 390 px, et les actions rares ne polluent pas la lecture.
 *
 * Le masquage et la sauvegarde passent par `feed-prefs-store` : le fil filtre
 * sa liste sur ce store, donc « Annuler » restaure instantanément.
 */
export function PostActions({
  threadId,
  threadSlug,
  comments,
  onOpen,
  management,
  className,
}: PostActionsProps) {
  const t = useT();
  const saved = useFeedPrefsStore((s) => s.saved.includes(threadId));
  const toggleSave = useFeedPrefsStore((s) => s.toggleSave);
  const hide = useFeedPrefsStore((s) => s.hide);

  /** Lien public de la question — calculé au clic, jamais au rendu (SSR). */
  const permalink = () =>
    `${window.location.origin}/#forum/${threadSlug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(permalink());
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const onHide = () => {
    hide(threadId);
    toast(t("post.hidden"), {
      action: {
        label: t("post.undo"),
        onClick: () => useFeedPrefsStore.getState().restore(threadId),
      },
    });
  };

  const onSave = () => {
    toggleSave(threadId);
    toast.success(saved ? t("post.unsaved") : t("post.saved"));
  };

  /**
   * Les entrées de gestion ne s'affichent **que** si le parent fournit un
   * handler : un menu avec des entrées mortes est pire qu'un menu absent.
   */
  const canPin = Boolean(management?.canPin && management.onTogglePin);
  const canEdit = Boolean(management?.canManage && management.onEdit);
  const canDelete = Boolean(management?.canManage && management.onDelete);
  const hasManagement = canPin || canEdit || canDelete;

  return (
    <div
      className={cn("mt-2.5 flex flex-wrap items-center gap-0.5", className)}
      /* La carte entière est cliquable : la barre d'actions ne doit pas
         ouvrir la discussion en même temps. */
      onClick={(e) => e.stopPropagation()}
    >
      <Action
        icon={MessageSquare}
        label={t("post.comment")}
        count={comments}
        onClick={() => onOpen?.()}
      />

      {/* Partager */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("common.share")}
            title={t("common.share")}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("common.share")}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => void copyLink()}>
            <Link2 className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.copy_link")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => window.open(permalink(), "_blank", "noopener")}
          >
            <ExternalLink className="me-2 h-4 w-4" aria-hidden="true" />
            {t("post.open_tab")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sauvegarder */}
      <Action
        icon={saved ? BookmarkCheck : Bookmark}
        label={saved ? t("post.unsave") : t("post.save")}
        active={saved}
        onClick={onSave}
      />

      {/* Menu ⋯ */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("post.more")}
            title={t("post.more")}
            className="ms-auto inline-flex items-center rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chart-1"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onHide}>
            <EyeOff className="me-2 h-4 w-4" aria-hidden="true" />
            {t("post.hide")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void copyLink()}>
            <Link2 className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.copy_link")}
          </DropdownMenuItem>

          {management && hasManagement && (
            <>
              <DropdownMenuSeparator />
              {canPin && (
                <DropdownMenuItem onSelect={() => management.onTogglePin?.()}>
                  {management.pinned ? (
                    <PinOff className="me-2 h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Pin className="me-2 h-4 w-4" aria-hidden="true" />
                  )}
                  {management.pinned ? t("post.unpin") : t("post.pin")}
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem onSelect={() => management.onEdit?.()}>
                  <Pencil className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("post.edit")}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => management.onDelete?.()}
                >
                  <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("post.delete")}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation de suppression                                         */
/* ------------------------------------------------------------------ */

/**
 * Confirmation de suppression, déclarée **à part** de la barre d'actions :
 * le parent en garde le contrôle, puisque c'est lui qui appelle l'API et qui
 * retire la publication de son état. `AlertDialog` gère le focus piégé,
 * `Escape` et l'attribution `aria-modal`.
 */
export function DeleteThreadDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              // Empêche la fermeture automatique : l'appelant ferme lui-même
              // quand la requête a réellement réussi.
              e.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-background hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
