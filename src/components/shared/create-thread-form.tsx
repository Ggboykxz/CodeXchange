"use client";

import { useState } from "react";
import { useT } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Catégories du forum — partagées par le formulaire du forum et le
 * composeur du fil d'accueil (un seul vocabulaire, une seule source).
 */
export const categories = [
  { value: "all", labelKey: "forum.filter.all" },
  { value: "general", labelKey: "forum.category.general" },
  { value: "frontend", labelKey: "forum.category.frontend" },
  { value: "backend", labelKey: "forum.category.backend" },
  { value: "mobile", labelKey: "forum.category.mobile" },
  { value: "devops", labelKey: "forum.category.devops" },
  { value: "ai", labelKey: "forum.category.ai" },
  { value: "career", labelKey: "forum.category.career" },
];

export interface NewThreadData {
  title: string;
  body: string;
  tags: string;
  category: string;
}

export function CreateThreadForm({
  onSubmit,
  categories: list = categories,
}: {
  onSubmit: (data: NewThreadData) => void;
  categories?: { value: string; labelKey: string }[];
}) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    onSubmit({ title, body, tags, category });
    setSubmitting(false);
    setTitle("");
    setBody("");
    setTags("");
    setCategory("general");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="ct-title" className="text-xs font-mono uppercase">
          {t("forum.create.title_field")}
        </Label>
        <Input
          id="ct-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          className="mt-1"
          placeholder={t("forum.create.title.placeholder")}
        />
      </div>
      <div>
        <Label htmlFor="ct-category" className="text-xs font-mono uppercase">
          {t("forum.create.category_field")}
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="ct-category" className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {list
              .filter((c) => c.value !== "all")
              .map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="ct-body" className="text-xs font-mono uppercase">
          {t("forum.create.body_field")}
        </Label>
        <Textarea
          id="ct-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={6}
          className="mt-1 resize-y"
          placeholder={t("forum.create.body.placeholder")}
        />
      </div>
      <div>
        <Label htmlFor="ct-tags" className="text-xs font-mono uppercase">
          {t("forum.create.tags_field")}
        </Label>
        <Input
          id="ct-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 font-mono"
          placeholder={t("forum.create.tags.placeholder")}
        />
      </div>
      <Button
        type="submit"
        disabled={submitting || !title || !body}
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
      >
        {t("forum.create.submit")}
      </Button>
    </form>
  );
}
