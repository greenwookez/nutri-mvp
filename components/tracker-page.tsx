"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Flame, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DaySummary, MealEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";

const today = format(new Date(), "yyyy-MM-dd");

type ViewMode = "day" | "week" | "month";

type MealForm = {
  date: string;
  time: string;
  mealType: string;
  foodName: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  notes: string;
};

const emptyMeal: MealForm = {
  date: today,
  time: "12:00",
  mealType: "Lunch",
  foodName: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
  notes: "",
};

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

const viewItems: Array<{ value: ViewMode; label: string }> = [
  { value: "day", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function TrackerPage() {
  const [view, setView] = useState<ViewMode>("day");
  const [date, setDate] = useState(today);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyMeal);

  const summaryEndpoint = useMemo(() => {
    if (view === "week") return `/api/summary/week?date=${date}`;
    if (view === "month") return `/api/summary/month?date=${date}`;
    return `/api/summary/day?date=${date}`;
  }, [view, date]);

  async function load() {
    const [entriesRes, summaryRes] = await Promise.all([
      fetch(`/api/entries?from=${date}&to=${date}`),
      fetch(summaryEndpoint),
    ]);
    setEntries(await entriesRes.json());
    setSummary(await summaryRes.json());
  }

  useEffect(() => {
    load();
  }, [date, summaryEndpoint]);

  async function addMeal() {
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carbs: Number(form.carbs),
      }),
    });
    setOpen(false);
    setForm({ ...emptyMeal, date });
    load();
  }

  async function removeMeal(id: number) {
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-gradient-to-b from-emerald-50/70 via-background to-background px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:space-y-6 md:px-8 md:pb-10">
      <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-4 mb-4 border-b border-emerald-100/70 bg-background/90 px-4 pb-3 pt-1 backdrop-blur md:static md:m-0 md:border-none md:bg-transparent md:p-0 md:backdrop-blur-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-emerald-700/70">Nutri tracker</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Food diary</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="hidden rounded-2xl bg-emerald-600 px-4 shadow-sm hover:bg-emerald-700 md:inline-flex">
                <Plus className="mr-1.5 h-4 w-4" /> Add meal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-emerald-100 sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Add meal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="meal-date">Date</Label>
                    <Input
                      id="meal-date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="meal-time">Time</Label>
                    <Input
                      id="meal-time"
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="meal-type">Meal type</Label>
                    <Select
                      value={form.mealType}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, mealType: value }))}
                    >
                      <SelectTrigger id="meal-type">
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="food-name">Food</Label>
                    <Input
                      id="food-name"
                      type="text"
                      value={form.foodName}
                      onChange={(e) => setForm((prev) => ({ ...prev, foodName: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={form.calories}
                      onChange={(e) => setForm((prev) => ({ ...prev, calories: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="protein">Protein</Label>
                    <Input
                      id="protein"
                      type="number"
                      value={form.protein}
                      onChange={(e) => setForm((prev) => ({ ...prev, protein: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="fat">Fat</Label>
                    <Input
                      id="fat"
                      type="number"
                      value={form.fat}
                      onChange={(e) => setForm((prev) => ({ ...prev, fat: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="carbs">Carbs</Label>
                    <Input
                      id="carbs"
                      type="number"
                      value={form.carbs}
                      onChange={(e) => setForm((prev) => ({ ...prev, carbs: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={addMeal}>
                  Save meal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 p-2">
          <CalendarDays className="h-4 w-4 text-emerald-700" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-xl border-emerald-200 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border-emerald-100 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="secondary" className="justify-center rounded-xl bg-rose-100/70 py-1.5 text-rose-900">
                {summary?.totals.calories ?? 0} kcal
              </Badge>
              <Badge variant="secondary" className="justify-center rounded-xl bg-sky-100/70 py-1.5 text-sky-900">
                P {summary?.totals.protein ?? 0}g
              </Badge>
              <Badge variant="secondary" className="justify-center rounded-xl bg-amber-100/70 py-1.5 text-amber-900">
                F {summary?.totals.fat ?? 0}g
              </Badge>
              <Badge variant="secondary" className="justify-center rounded-xl bg-violet-100/70 py-1.5 text-violet-900">
                C {summary?.totals.carbs ?? 0}g
              </Badge>
            </div>
            <div className="rounded-2xl bg-emerald-50/80 p-3 text-emerald-900">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-700">
                <Flame className="h-3.5 w-3.5" /> Active calories
              </p>
              <p className="text-base font-semibold">{summary?.activeCalories ?? 0} kcal</p>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-3 py-2 text-white">
              <span className="text-xs uppercase tracking-wide text-slate-300">Remaining budget</span>
              <span className="text-base font-semibold">{summary?.deltaCalories ?? 0} kcal</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-emerald-100 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Meals ({entries.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entries.length === 0 && (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-muted-foreground">No meals logged</p>
            )}
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/40 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{entry.foodName}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.date} {entry.time} · {entry.mealType}
                  </p>
                  <p className="mt-1 text-slate-700">
                    {entry.calories} kcal · P{entry.protein} F{entry.fat} C{entry.carbs}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => removeMeal(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete meal</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-emerald-100 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-3xl bg-emerald-50/80 px-2 py-2">
          <div className="flex items-center justify-around gap-1">
            {viewItems.slice(0, 2).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setView(item.value)}
                className={cn(
                  "rounded-2xl px-3 py-2 text-xs font-medium transition",
                  view === item.value ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button
            size="icon"
            onClick={() => setOpen(true)}
            className="h-12 w-12 rounded-full bg-emerald-600 shadow-md hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            <span className="sr-only">Add meal</span>
          </Button>

          <div className="flex justify-end pr-1">
            <button
              type="button"
              onClick={() => setView("month")}
              className={cn(
                "rounded-2xl px-3 py-2 text-xs font-medium transition",
                view === "month" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500",
              )}
            >
              Month
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
