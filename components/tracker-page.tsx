"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DaySummary, MealEntry } from "@/lib/types";

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
    <main className="mx-auto max-w-4xl space-y-4 p-4 md:space-y-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Nutri MVP</h1>
        <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}>
          <TabsList className="grid w-full grid-cols-3 md:w-[320px]">
            <TabsTrigger value="day">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full max-w-[220px]"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Add meal</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Add meal</DialogTitle>
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

              <Button onClick={addMeal}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Calories: {summary?.totals.calories ?? 0}</Badge>
              <Badge variant="secondary">Protein: {summary?.totals.protein ?? 0}</Badge>
              <Badge variant="secondary">Fat: {summary?.totals.fat ?? 0}</Badge>
              <Badge variant="secondary">Carbs: {summary?.totals.carbs ?? 0}</Badge>
            </div>
            <p>Active calories: {summary?.activeCalories ?? 0}</p>
            <p className="font-semibold">Remaining budget: {summary?.deltaCalories ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Meals ({entries.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entries.length === 0 && <p className="text-sm text-muted-foreground">No meals logged</p>}
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{entry.foodName}</p>
                  <p className="text-muted-foreground">
                    {entry.date} {entry.time} · {entry.mealType}
                  </p>
                  <p>
                    {entry.calories} kcal · P{entry.protein} F{entry.fat} C{entry.carbs}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeMeal(entry.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
