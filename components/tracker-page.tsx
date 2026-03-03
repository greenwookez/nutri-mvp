"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DaySummary, MealEntry } from "@/lib/types";

const today = format(new Date(), "yyyy-MM-dd");

type ViewMode = "day" | "week" | "month";

const emptyMeal = {
  date: today,
  time: "12:00",
  mealType: "Lunch",
  foodName: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
  notes: ""
};

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
      fetch(summaryEndpoint)
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
        carbs: Number(form.carbs)
      })
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
    <main className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Nutri MVP</h1>
        <div className="flex gap-2">
          <Button variant={view === "day" ? "default" : "outline"} onClick={() => setView("day")}>Today</Button>
          <Button variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>Week</Button>
          <Button variant={view === "month" ? "default" : "outline"} onClick={() => setView("month")}>Month</Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[200px]" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Add meal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add meal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              {[
                ["Date", "date", "date"],
                ["Time", "time", "time"],
                ["Meal type", "mealType", "text"],
                ["Food", "foodName", "text"],
                ["Calories", "calories", "number"],
                ["Protein", "protein", "number"],
                ["Fat", "fat", "number"],
                ["Carbs", "carbs", "number"],
                ["Notes", "notes", "text"]
              ].map(([label, key, type]) => (
                <div key={key as string} className="grid gap-1">
                  <Label>{label}</Label>
                  <Input
                    type={type as string}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <Button onClick={addMeal}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Calories: {summary?.totals.calories ?? 0}</p>
            <p>Protein: {summary?.totals.protein ?? 0}</p>
            <p>Fat: {summary?.totals.fat ?? 0}</p>
            <p>Carbs: {summary?.totals.carbs ?? 0}</p>
            <p>Active calories: {summary?.activeCalories ?? 0}</p>
            <p className="font-semibold">Remaining budget: {summary?.deltaCalories ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Meals ({entries.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {entries.length === 0 && <p className="text-sm text-muted-foreground">No meals logged</p>}
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{entry.foodName}</p>
                  <p className="text-muted-foreground">{entry.date} {entry.time} · {entry.mealType}</p>
                  <p>{entry.calories} kcal · P{entry.protein} F{entry.fat} C{entry.carbs}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeMeal(entry.id)}>Delete</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
