"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FavoriteItem, FavoritePortion } from "@/lib/types";
import { format } from "date-fns";
import { toast } from "sonner";

const today = format(new Date(), "yyyy-MM-dd");
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

function parsePortions(input: string): FavoritePortion[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, gramsPart] = line.split(":").map((chunk) => chunk.trim());
      return { label: labelPart, grams: Number(gramsPart) };
    })
    .filter((portion) => portion.label && Number.isFinite(portion.grams) && portion.grams > 0);
}

function scale(value: number, grams: number) {
  return Number(((value * grams) / 100).toFixed(1));
}

export function FavoritesSection({ onTracked }: { onTracked: () => Promise<void> }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [selected, setSelected] = useState<FavoriteItem | null>(null);

  const [label, setLabel] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [notes, setNotes] = useState("");
  const [portionsText, setPortionsText] = useState("");

  const [date, setDate] = useState(today);
  const [time, setTime] = useState("12:00");
  const [mealType, setMealType] = useState("Lunch");
  const [grams, setGrams] = useState("100");

  const sorted = useMemo(() => [...items].sort((a, b) => a.label.localeCompare(b.label)), [items]);

  async function load() {
    const res = await fetch("/api/favorites");
    if (!res.ok) return;
    setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createFavorite() {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        caloriesPer100g: Number(kcal),
        proteinPer100g: Number(protein),
        fatPer100g: Number(fat),
        carbsPer100g: Number(carbs),
        notes,
        portions: parsePortions(portionsText),
      }),
    });

    if (!res.ok) {
      toast.error("Could not save favorite");
      return;
    }

    toast.success("Favorite saved");
    setLabel("");
    setKcal("");
    setProtein("");
    setFat("");
    setCarbs("");
    setNotes("");
    setPortionsText("");
    await load();
  }

  async function trackFromFavorite(target: FavoriteItem, gramsValue: number, overrideLabel?: string) {
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        time,
        mealType,
        foodName: overrideLabel ?? `${target.label} (${gramsValue}g)`,
        calories: scale(target.caloriesPer100g, gramsValue),
        protein: scale(target.proteinPer100g, gramsValue),
        fat: scale(target.fatPer100g, gramsValue),
        carbs: scale(target.carbsPer100g, gramsValue),
        notes: target.notes,
        favoriteId: target.id,
        grams: gramsValue,
      }),
    });

    if (!res.ok) {
      toast.error("Could not track meal");
      return;
    }

    toast.success("Meal tracked");
    await onTracked();
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
      <Card className="rounded-[1.25rem] border-emerald-100 bg-white/95 shadow-sm md:rounded-3xl">
        <CardHeader><CardTitle className="text-base font-semibold md:text-lg">Favorites ({items.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {sorted.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelected(item)} className="w-full rounded-2xl border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/40 p-3 text-left">
              <p className="truncate text-[15px] font-medium text-slate-900">{item.label}</p>
              <p className="mt-1 text-[13px] text-slate-700">{item.caloriesPer100g} kcal · P{item.proteinPer100g} F{item.fatPer100g} C{item.carbsPer100g} /100g</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-[1.25rem] border-emerald-100 bg-white/95 shadow-sm md:rounded-3xl">
        <CardHeader><CardTitle className="text-base font-semibold md:text-lg">Create favorite</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-1.5"><Label>Name</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5"><Label>kcal/100g</Label><Input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Protein</Label><Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Fat</Label><Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Carbs</Label><Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Portions</Label><Textarea rows={2} placeholder="Cup: 240" value={portionsText} onChange={(e) => setPortionsText(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Notes</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          <Button className="rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700" onClick={createFavorite}><Plus className="mr-1.5 h-4 w-4"/>Save favorite</Button>
        </CardContent>
      </Card>

      {selected ? (
        <Card className="md:col-span-2 rounded-[1.25rem] border-emerald-100 bg-white/95 shadow-sm md:rounded-3xl">
          <CardHeader><CardTitle className="text-base font-semibold md:text-lg">Track from: {selected.label}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="grid gap-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Time</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Meal type</Label><Select value={mealType} onValueChange={setMealType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{mealTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1.5"><Label>Grams</Label><Input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.portions.map((portion) => (
                <Button key={`${portion.label}-${portion.grams}`} variant="outline" className="rounded-full" onClick={() => trackFromFavorite(selected, portion.grams, `${selected.label} (${portion.label})`)}>
                  {portion.label} · {portion.grams}g
                </Button>
              ))}
            </div>
            <Button className="rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700" onClick={() => trackFromFavorite(selected, Number(grams))}><Star className="mr-1.5 h-4 w-4"/>Track from favorite</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
