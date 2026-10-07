"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { CATEGORIES, JOB_TYPES, PROJECT_STATUSES } from "@/lib/validate";

/**
 * Publication des quatre contenus du site (offres, projets, tutos, events).
 *
 * Un **seul** composant pour les quatre : le champ `kind` choisit l'endpoint,
 * le formulaire et le libellé, ce qui évite quatre copies du circuit
 * d'erreur (401 → modale de connexion, 400 → erreur par champ en
 * `role="alert"`, 429 → message de rate-limit).
 */
export type ContentKind = "job" | "project" | "tutorial" | "event";

const ENDPOINTS: Record<ContentKind, string> = {
  job: "/api/jobs",
  project: "/api/projects",
  tutorial: "/api/tutorials",
  event: "/api/events",
};

/** Champs zod renvoyés en `details` : `{ title: ["Trop court"] }`. */
type FieldErrors = Record<string, string[] | undefined>;

interface FormProps {
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  errors: FieldErrors;
  pending: boolean;
}

interface ContentDialogProps<T> {
  kind: ContentKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Appelé avec l'entité renvoyée par l'API (201) — l'appelant l'insère. */
  onCreated: (item: T) => void;
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/** Libellé + contrôle + message d'erreur (`role="alert"`, lisible par TdV). */
function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-mono uppercase">
        {label}
        {optional && (
          <span className="ml-1.5 font-sans normal-case text-muted-foreground">
            ({t("create.optional")})
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** `""` → `null` : on stocke jamais une chaîne vide dans une colonne nullable. */
const orNull = (v: string) => (v.trim() ? v.trim() : null);
/** Les emojis de couverture ne sont transmis que s'ils sont saisis. */
const omitIfEmpty = (key: string, value: string) =>
  value.trim() ? { [key]: value.trim() } : {};

/**
 * Les messages de zod sont rédigés en anglais (`Too big: expected string to
 * have <=140 characters`) : on traduit les patrons les plus fréquents pour ne
 * pas servir du texte anglais sous un libellé français, et on renvoie tel quel
 * ce qu'on ne reconnaît pas plutôt que de masquer l'information.
 */
function formatIssue(message: string, t: (key: string) => string): string {
  const big = /^Too big: expected string to have <=(\d+) characters?$/.exec(message);
  if (big) return t("error.too_big").replace("{n}", big[1]);
  const small = /^Too small: expected string to have >=(\d+) characters?$/.exec(message);
  if (small) return t("error.too_small").replace("{n}", small[1]);
  if (message === "Invalid url") return t("error.invalid_url");
  if (message.startsWith("Invalid input:")) return t("error.invalid_input");
  return message;
}

function SubmitButton({ pending }: { pending: boolean }) {
  const t = useT();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-foreground text-background hover:bg-foreground/90"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Plus className="h-4 w-4" aria-hidden="true" />
      )}
      {t("create.submit")}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Les quatre formulaires                                              */
/* ------------------------------------------------------------------ */

function JobForm({ onSubmit, errors, pending }: FormProps) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("full-time");
  const [stack, setStack] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [salary, setSalary] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [remote, setRemote] = useState(true);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({
          title,
          company,
          description,
          type,
          stack,
          location: orNull(location),
          country: orNull(country),
          salary: orNull(salary),
          applyUrl: orNull(applyUrl),
          remote,
        });
      }}
    >
      <Field id="job-title" label={t("jobs.create.title")} error={errors.title?.[0]}>
        <Input
          id="job-title"
          required
          minLength={4}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("jobs.create.title_hint")}
        />
      </Field>

      <Field id="job-company" label={t("jobs.create.company")} error={errors.company?.[0]}>
        <Input
          id="job-company"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </Field>

      <Field id="job-description" label={t("jobs.create.description")} error={errors.description?.[0]}>
        <Textarea
          id="job-description"
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("jobs.create.description_hint")}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="job-type" label={t("jobs.create.type")} error={errors.type?.[0]}>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="job-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map((v) => (
                <SelectItem key={v} value={v}>
                  {t(`jobs.type.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="job-stack" label={t("jobs.create.stack")} error={errors.stack?.[0]}>
          <Input
            id="job-stack"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder={t("jobs.create.stack_hint")}
          />
        </Field>

        <Field id="job-location" label={t("jobs.create.location")} error={errors.location?.[0]} optional>
          <Input id="job-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>

        <Field id="job-country" label={t("jobs.create.country")} error={errors.country?.[0]} optional>
          <Input id="job-country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </Field>

        <Field id="job-salary" label={t("jobs.create.salary")} error={errors.salary?.[0]} optional>
          <Input
            id="job-salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder={t("jobs.create.salary_hint")}
          />
        </Field>

        <Field id="job-apply" label={t("jobs.create.apply_url")} error={errors.applyUrl?.[0]} optional>
          <Input
            id="job-apply"
            type="url"
            inputMode="url"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="job-remote" checked={remote} onCheckedChange={(v) => setRemote(v === true)} />
        <Label htmlFor="job-remote" className="font-normal normal-case">
          {t("jobs.create.remote")}
        </Label>
      </div>

      <SubmitButton pending={pending} />
    </form>
  );
}

function ProjectForm({ onSubmit, errors, pending }: FormProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("idea");
  const [stack, setStack] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({
          name,
          tagline,
          description,
          status,
          stack,
          lookingFor,
          repoUrl: orNull(repoUrl),
          demoUrl: orNull(demoUrl),
        });
      }}
    >
      <Field id="project-name" label={t("projects.create.name")} error={errors.name?.[0]}>
        <Input id="project-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field id="project-tagline" label={t("projects.create.tagline")} error={errors.tagline?.[0]}>
        <Input
          id="project-tagline"
          required
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder={t("projects.create.tagline_hint")}
        />
      </Field>

      <Field id="project-description" label={t("projects.create.description")} error={errors.description?.[0]}>
        <Textarea
          id="project-description"
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="project-status" label={t("projects.create.status")} error={errors.status?.[0]}>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="project-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((v) => (
                <SelectItem key={v} value={v}>
                  {t(`projects.status.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="project-stack" label={t("projects.create.stack")} error={errors.stack?.[0]}>
          <Input
            id="project-stack"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder={t("jobs.create.stack_hint")}
          />
        </Field>

        <Field id="project-looking" label={t("projects.create.looking_for")} error={errors.lookingFor?.[0]} optional>
          <Input
            id="project-looking"
            value={lookingFor}
            onChange={(e) => setLookingFor(e.target.value)}
            placeholder={t("projects.create.looking_hint")}
          />
        </Field>

        <Field id="project-repo" label={t("projects.create.repo_url")} error={errors.repoUrl?.[0]} optional>
          <Input
            id="project-repo"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/…"
          />
        </Field>

        <Field id="project-demo" label={t("projects.create.demo_url")} error={errors.demoUrl?.[0]} optional>
          <Input
            id="project-demo"
            type="url"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>
      </div>

      <SubmitButton pending={pending} />
    </form>
  );
}

function TutorialForm({ onSubmit, errors, pending }: FormProps) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [tags, setTags] = useState("");
  const [coverEmoji, setCoverEmoji] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({
          title,
          excerpt,
          body,
          category,
          tags,
          ...omitIfEmpty("coverEmoji", coverEmoji),
        });
      }}
    >
      <Field id="tuto-title" label={t("tutos.create.title")} error={errors.title?.[0]}>
        <Input id="tuto-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field id="tuto-excerpt" label={t("tutos.create.excerpt")} error={errors.excerpt?.[0]}>
        <Input
          id="tuto-excerpt"
          required
          minLength={10}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder={t("tutos.create.excerpt_hint")}
        />
      </Field>

      <Field id="tuto-body" label={t("tutos.create.body")} error={errors.body?.[0]}>
        <Textarea
          id="tuto-body"
          required
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("tutos.create.body_hint")}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="tuto-category" label={t("tutos.create.category")} error={errors.category?.[0]}>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="tuto-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((v) => (
                <SelectItem key={v} value={v}>
                  {t(`forum.category.${v}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="tuto-tags" label={t("tutos.create.tags")} error={errors.tags?.[0]} optional>
          <Input
            id="tuto-tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t("jobs.create.stack_hint")}
          />
        </Field>

        <Field id="tuto-emoji" label={t("tutos.create.cover_emoji")} error={errors.coverEmoji?.[0]} optional>
          <Input
            id="tuto-emoji"
            value={coverEmoji}
            onChange={(e) => setCoverEmoji(e.target.value)}
            maxLength={8}
            placeholder="🚀"
          />
        </Field>
      </div>

      <SubmitButton pending={pending} />
    </form>
  );
}

function EventForm({ onSubmit, errors, pending }: FormProps) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [online, setOnline] = useState(false);
  const [url, setUrl] = useState("");
  const [coverEmoji, setCoverEmoji] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({
          title,
          description,
          // `datetime-local` donne un fuseau local : `Date` convertit en ISO,
          // format attendu par `dateTime` (zod) et par Postgres.
          date: date ? new Date(date).toISOString() : date,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          location: orNull(location),
          online,
          url: orNull(url),
          ...omitIfEmpty("coverEmoji", coverEmoji),
        });
      }}
    >
      <Field id="event-title" label={t("events.create.title")} error={errors.title?.[0]}>
        <Input id="event-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field id="event-description" label={t("events.create.description")} error={errors.description?.[0]}>
        <Textarea
          id="event-description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="event-date" label={t("events.create.date")} error={errors.date?.[0]}>
          <Input
            id="event-date"
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field id="event-end" label={t("events.create.end_date")} error={errors.endDate?.[0]} optional>
          <Input
            id="event-end"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>

        <Field id="event-location" label={t("events.create.location")} error={errors.location?.[0]} optional>
          <Input
            id="event-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={online ? "Visio — lien à préciser" : "Dakar, Sénégal"}
          />
        </Field>

        <Field id="event-url" label={t("events.create.url")} error={errors.url?.[0]} optional>
          <Input
            id="event-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>

        <Field id="event-emoji" label={t("events.create.cover_emoji")} error={errors.coverEmoji?.[0]} optional>
          <Input
            id="event-emoji"
            value={coverEmoji}
            onChange={(e) => setCoverEmoji(e.target.value)}
            maxLength={8}
            placeholder="🎤"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="event-online" checked={online} onCheckedChange={(v) => setOnline(v === true)} />
        <Label htmlFor="event-online" className="font-normal normal-case">
          {t("events.create.online")}
        </Label>
      </div>

      <SubmitButton pending={pending} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Boîte de dialogue                                                   */
/* ------------------------------------------------------------------ */

const TITLES: Record<ContentKind, string> = {
  job: "create.job",
  project: "create.project",
  tutorial: "create.tutorial",
  event: "create.event",
};

export function ContentDialog<T>({
  kind,
  open,
  onOpenChange,
  onCreated,
}: ContentDialogProps<T>) {
  const t = useT();
  const openAuth = useAuthStore((s) => s.openAuth);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const send = async (payload: Record<string, unknown>) => {
    setPending(true);
    setErrors({});
    setFormError(null);
    try {
      const res = await fetch(ENDPOINTS[kind], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Session absente ou expirée : on bascule sur la connexion unique.
      if (res.status === 401) {
        onOpenChange(false);
        openAuth("login");
        setFormError(t("create.signin_required"));
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setFormError(t("create.rate_limited"));
          return;
        }
        if (data.details && typeof data.details === "object") {
          // `details` = `zod.flatten().fieldErrors` : chaque message est
          // affiché sous son champ, pas dans un toast illisible.
          const localized: FieldErrors = {};
          for (const [field, messages] of Object.entries(
            data.details as Record<string, string[] | undefined>
          )) {
            localized[field] = messages?.map((m) => formatIssue(m, t));
          }
          setErrors(localized);
          setFormError(t("create.check_fields"));
          return;
        }
        setFormError(data.error || t("common.error"));
        return;
      }

      const created = data[kind] as T;
      onCreated(created);
      onOpenChange(false);
      toast.success(t("create.published"));
    } catch {
      setFormError(t("common.network_error"));
    } finally {
      setPending(false);
    }
  };

  const Form =
    kind === "job"
      ? JobForm
      : kind === "project"
      ? ProjectForm
      : kind === "tutorial"
      ? TutorialForm
      : EventForm;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setErrors({});
          setFormError(null);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl scroll-pretty">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            <span className="text-muted-foreground">$</span> {t(TITLES[kind])}
          </DialogTitle>
        </DialogHeader>

        {formError && (
          <p role="alert" className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}

        {/* `key` : on repart d'un formulaire vierge à chaque réouverture. */}
        <Form key={kind} onSubmit={send} errors={errors} pending={pending} />
      </DialogContent>
    </Dialog>
  );
}
