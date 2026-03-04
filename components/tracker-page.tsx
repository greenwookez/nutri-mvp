"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, ChevronDown, Flame, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "./ui/textarea";
import { Skeleton } from "./ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summaryEndpoint = useMemo(() => {
    if (view === "week") return `/api/summary/week?date=${date}`;
    if (view === "month") return `/api/summary/month?date=${date}`;
    return `/api/summary/day?date=${date}`;
  }, [view, date]);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const [entriesRes, summaryRes] = await Promise.all([
        fetch(`/api/entries?from=${date}&to=${date}`),
        fetch(summaryEndpoint),
      ]);

      if (!entriesRes.ok || !summaryRes.ok) {
        throw new Error("Failed to load tracker data");
      }

      setEntries(await entriesRes.json());
      setSummary(await summaryRes.json());
    } catch {
      setError("Could not load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [date, summaryEndpoint]);

  async function addMeal() {
    try {
      const response = await fetch("/api/entries", {
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

      if (!response.ok) {
        throw new Error("Failed to add meal");
      }

      setOpen(false);
      setForm({ ...emptyMeal, date });
      toast.success("Meal added", {
        description: `${form.foodName || "Entry"} saved to your diary.`,
      });
      await load();
    } catch {
      toast.error("Could not add meal", {
        description: "Please try again.",
      });
    }
  }

  async function removeMeal(id: number, foodName: string) {
    try {
      const response = await fetch(`/api/entries/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete meal");
      }

      toast.success("Meal deleted", {
        description: `${foodName} was removed from your diary.`,
      });
      await load();
    } catch {
      toast.error("Could not delete meal", {
        description: "Please try again.",
      });
    }
  }

  const mealFormFields = (
    <div className="grid gap-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
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

      <Button className="rounded-xl bg-emerald-600 text-[15px] font-semibold hover:bg-emerald-700" onClick={addMeal}>
        Save meal
      </Button>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl bg-gradient-to-b from-emerald-50/65 via-background to-background px-4 pb-[calc(8.25rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] md:space-y-6 md:px-8 md:pb-10">
      <div className="sticky top-0 z-20 -mx-4 mb-3 border-b border-emerald-100/80 bg-background/92 px-4 pb-3 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:m-0 md:border-none md:bg-transparent md:p-0 md:backdrop-blur-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700/70">Nutri tracker</p>
            <h1 className="text-[30px] font-semibold leading-[1.06] tracking-tight text-slate-900 md:text-4xl">Food diary</h1>
          </div>
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="hidden rounded-2xl bg-emerald-600 px-4 text-sm font-semibold shadow-sm hover:bg-emerald-700 md:inline-flex">
                  <Plus className="mr-1.5 h-4 w-4" /> Add meal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-emerald-100 sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle className="text-xl">Add meal</DialogTitle>
                  <DialogDescription>
                    Fill in the meal details and save to add this entry to your diary.
                  </DialogDescription>
                </DialogHeader>
                {mealFormFields}
              </DialogContent>
            </Dialog>

          </>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as ViewMode)}
            aria-label="Select summary range"
            className="hidden sm:block"
          >
            <TabsList className="h-10 w-full justify-start rounded-2xl bg-emerald-50 p-1 sm:w-auto">
              {viewItems.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="rounded-xl text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-emerald-900"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-2">
            <CalendarDays className="h-4 w-4 text-emerald-700" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  aria-label="Choose date"
                  className="h-9 min-w-0 flex-1 justify-between rounded-xl border-emerald-200 bg-white px-3 text-left text-sm font-medium text-slate-800 sm:min-w-[180px] sm:flex-none"
                >
                  {format(new Date(`${date}T00:00:00`), "PPP")}
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-2xl border-emerald-100 p-0" align="start">
                <Calendar
                  mode="single"
                  selected={new Date(`${date}T00:00:00`)}
                  onSelect={(nextDate) => {
                    if (nextDate) setDate(format(nextDate, "yyyy-MM-dd"));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <Card className="rounded-[1.25rem] border-emerald-100 bg-white/95 shadow-sm md:rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold md:text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm">
            {isLoading ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-8 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-10 rounded-2xl" />
              </div>
            ) : error ? (
              <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Badge
                    variant="secondary"
                    className="justify-center rounded-xl bg-rose-100/70 py-1.5 text-[13px] font-medium text-rose-900"
                  >
                    {summary?.totals.calories ?? 0} kcal
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="justify-center rounded-xl bg-sky-100/70 py-1.5 text-[13px] font-medium text-sky-900"
                  >
                    P {summary?.totals.protein ?? 0}g
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="justify-center rounded-xl bg-amber-100/70 py-1.5 text-[13px] font-medium text-amber-900"
                  >
                    F {summary?.totals.fat ?? 0}g
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="justify-center rounded-xl bg-violet-100/70 py-1.5 text-[13px] font-medium text-violet-900"
                  >
                    C {summary?.totals.carbs ?? 0}g
                  </Badge>
                </div>
                <div className="rounded-2xl bg-emerald-50/80 p-3 text-emerald-900">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    <Flame className="h-3.5 w-3.5" /> Active calories
                  </p>
                  <p className="mt-0.5 text-lg font-semibold leading-tight">{summary?.activeCalories ?? 0} kcal</p>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-3 py-2.5 text-white">
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">Remaining budget</span>
                  <span className="text-lg font-semibold leading-tight">{summary?.deltaCalories ?? 0} kcal</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.25rem] border-emerald-100 bg-white/95 shadow-sm md:rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold md:text-lg">Meals ({entries.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
            ) : entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
                No meals logged
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/40 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-medium text-slate-900">{entry.foodName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
                      <span>
                        {entry.date} {entry.time}
                      </span>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-emerald-100/80 px-2 py-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-900"
                      >
                        {entry.mealType}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-slate-700">
                      {entry.calories} kcal · P{entry.protein} F{entry.fat} C{entry.carbs}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Delete ${entry.foodName}`}
                        className="h-8 w-8 shrink-0 rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete meal</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete meal entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {entry.foodName} from your diary.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => removeMeal(entry.id, entry.foodName)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-4 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 sm:hidden">
        <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-100/80 bg-white/95 p-1.5 shadow-lg shadow-emerald-100/70 backdrop-blur">
          {viewItems.map((item) => {
            const active = view === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setView(item.value)}
                className={`h-10 min-w-0 flex-1 rounded-xl px-2 text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-emerald-900/70 hover:bg-emerald-50 active:scale-[0.98]"
                }`}
                aria-pressed={active}
              >
                {item.label}
              </button>
            );
          })}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition active:scale-[0.97]"
                aria-label="Add meal"
              >
                <Plus className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[90dvh] overflow-y-auto rounded-t-3xl border-emerald-100 px-4 pb-6 pt-5"
            >
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left text-xl">Add meal</SheetTitle>
                <SheetDescription className="text-left">
                  Fill in the meal details and save to add this entry to your diary.
                </SheetDescription>
              </SheetHeader>
              {mealFormFields}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </main>
  );
}
