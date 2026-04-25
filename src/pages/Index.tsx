import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import SlotCard, { Slot } from "@/components/SlotCard";
import heroImg from "@/assets/hero.jpg";

type Reservation = { id: string; slot_id: string; reserver_name: string; reserver_user_id: string | null; expires_at: string; active: boolean };

const Index = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    // expire old reservations first
    const nowIso = new Date().toISOString();
    await supabase.from("reservations").update({ active: false }).lt("expires_at", nowIso).eq("active", true);
    // ensure slots that have no active reservation are available
    const { data: slotData } = await supabase.from("parking_slots").select("*").order("slot_code");
    const { data: resData } = await supabase
      .from("reservations")
      .select("*")
      .eq("active", true)
      .gt("expires_at", nowIso);

    // sync slot status if needed (defensive)
    if (slotData) {
      const reservedIds = new Set((resData ?? []).map((r) => r.slot_id));
      for (const s of slotData) {
        if (s.status === "reserved" && !reservedIds.has(s.id)) {
          await supabase.from("parking_slots").update({ status: "available" }).eq("id", s.id);
          s.status = "available";
        }
      }
    }
    setSlots(slotData ?? []);
    setReservations(resData ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const availableCount = useMemo(() => slots.filter((s) => s.status === "available").length, [slots]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-40" width={1536} height={1024} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container max-w-5xl py-12 sm:py-24 px-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3 sm:mb-4">A community service</p>
          <h1 className="font-display text-3xl sm:text-6xl leading-[1.1] tracking-tight max-w-3xl">
            Reserve a parking spot.<br />
            <span className="text-primary">Arrive in time for Salah.</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Quick, simple parking sharing for our community. See what's available, hold a spot for up to 60 minutes, and pray with peace of mind.
          </p>
          <div className="mt-6 sm:mt-8 inline-flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-full bg-primary-soft text-primary text-xs sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-available" />
            {availableCount} of {slots.length} spots available right now
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-10 sm:py-16 px-4">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl">Available spots</h2>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : slots.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">No parking slots have been added yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Visit the Admin page to add the first one.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot) => {
              const res = reservations.find((r) => r.slot_id === slot.id) ?? null;
              return <SlotCard key={slot.id} slot={slot} activeReservation={res} onChange={load} />;
            })}
          </div>
        )}
      </section>
    </>
  );
};

export default Index;
