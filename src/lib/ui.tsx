"use client";
import { createContext, useContext } from "react";

export type View = "painel" | "funil" | "conversas" | "pacientes" | "agenda" | "pendencias" | "ajustes";
export const VIEWS: View[] = ["painel", "funil", "conversas", "pacientes", "agenda", "pendencias", "ajustes"];

export type Rect = { left: number; top: number; width: number; height: number };
type UI = {
  view: View;
  ir: (v: View) => void;
  abrirFicha: (id: string, origem?: Rect | null, foco?: "nome") => void;
  abrirConversa: (id: string) => void;
  conversaId: string | null;
  setConversaId: (id: string | null) => void;
  novoContato: () => void;
};
export const UICtx = createContext<UI | null>(null);
export const useUI = () => useContext(UICtx)!;

export const rectDe = (el: Element | null): Rect | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};
