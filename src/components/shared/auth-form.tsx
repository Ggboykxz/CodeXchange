"use client";

import { useState } from "react";
import { useT } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "register";
  onSuccess: () => void;
  onSwitch: () => void;
}

const countries = [
  "Sénégal",
  "Côte d'Ivoire",
  "Nigeria",
  "Kenya",
  "Ghana",
  "Mali",
  "Gabon",
  "Egypt",
  "RD Congo",
  "Burkina Faso",
  "Cameroun",
  "Maroc",
  "Tunisie",
  "Afrique du Sud",
  "Autre",
];

export function AuthForm({ mode, onSuccess, onSwitch }: AuthFormProps) {
  const t = useT();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  // Register fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [stack, setStack] = useState("");
  const [level, setLevel] = useState("junior");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { name, email, password, username, country, city, stack, level };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur");
        return;
      }

      setUser(data.user);
      toast.success(
        mode === "login"
          ? `Bon retour, ${data.user.name} !`
          : `Bienvenue sur CodeXchange, ${data.user.name} !`
      );
      onSuccess();
    } catch {
      toast.error(t("common.network_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === "register" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name" className="text-xs font-mono uppercase">
                {t("auth.name")}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                placeholder="Aïcha Diallo"
              />
            </div>
            <div>
              <Label htmlFor="username" className="text-xs font-mono uppercase">
                {t("auth.username")}
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1"
                placeholder="aicha.dev"
              />
            </div>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="email" className="text-xs font-mono uppercase">
          {t("auth.email")}
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1"
          placeholder="toi@exemple.com"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-xs font-mono uppercase">
          {t("auth.password")}
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1"
          placeholder="••••••••"
        />
      </div>

      {mode === "register" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="country" className="text-xs font-mono uppercase">
                {t("auth.country")}
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city" className="text-xs font-mono uppercase">
                {t("auth.city")}
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1"
                placeholder="Dakar"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stack" className="text-xs font-mono uppercase">
                {t("auth.stack")}
              </Label>
              <Input
                id="stack"
                value={stack}
                onChange={(e) => setStack(e.target.value)}
                className="mt-1"
                placeholder="React, Go"
              />
            </div>
            <div>
              <Label htmlFor="level" className="text-xs font-mono uppercase">
                {t("auth.level")}
              </Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Confirmé·e</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead / Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-foreground text-background hover:bg-foreground/90 mt-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : null}
        {mode === "login" ? t("auth.login.submit") : t("auth.register.submit")}
      </Button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onSwitch}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition"
        >
          {mode === "login"
            ? t("auth.switch.to_register")
            : t("auth.switch.to_login")}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {mode === "login" && (
        <p className="text-[10px] text-muted-foreground/70 text-center font-mono">
          {t("auth.demo_note")}
        </p>
      )}
    </form>
  );
}
