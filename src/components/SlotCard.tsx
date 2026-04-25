import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, MapPin, User } from "lucide-react";

export type Slot = {
  id: string;
  slot_code: string;
  owner_name: string;
  description: string | null;
  picture_url: string | null;
  status: string;
};

type Props = { slot: Slot; activeReservation?: { id: string; reserver_name: string; expires_at: string } | null; onChange: () => void };

const SlotCard = ({ slot, activeReservation, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const isAvailable = slot.status === "available";

  const reserve = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      toast.error("Please enter your name (2–60 characters).");
      return;
    }
    setBusy(true);
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("reservations").insert({
      slot_id: slot.id,
      reserver_name: trimmed,
      expires_at: expires,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not reserve. It may have just been taken.");
    } else {
      toast.success(`Slot ${slot.slot_code} reserved for 60 minutes.`);
      setOpen(false);
      setName("");
      onChange();
    }
  };

  const release = async () => {
    if (!activeReservation) return;
    setBusy(true);
    const { error } = await supabase
      .from("reservations")
      .update({ active: false })
      .eq("id", activeReservation.id);
    setBusy(false);
    if (error) toast.error("Could not release the slot.");
    else {
      toast.success("Slot released.");
      onChange();
    }
  };

  return (
    <Card className="overflow-hidden shadow-soft hover:shadow-card transition-shadow border-border/60">
      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
        {slot.picture_url ? (
          <img src={slot.picture_url} alt={`Parking slot ${slot.slot_code}`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MapPin className="h-10 w-10 opacity-30" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge
            variant="secondary"
            className={
              isAvailable
                ? "bg-available text-available-foreground hover:bg-available"
                : "bg-reserved text-reserved-foreground hover:bg-reserved"
            }
          >
            {isAvailable ? "Available" : "Reserved"}
          </Badge>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl">Slot {slot.slot_code}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" /> {slot.owner_name}
        </div>
        {slot.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{slot.description}</p>
        )}
        {isAvailable ? (
          <Button className="w-full" onClick={() => setOpen(true)}>
            Reserve for 60 min
          </Button>
        ) : activeReservation ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Held by {activeReservation.reserver_name} · until {new Date(activeReservation.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <Button variant="outline" className="w-full" onClick={release} disabled={busy}>
              Release slot
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" disabled>Unavailable</Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Reserve slot {slot.slot_code}</DialogTitle>
            <DialogDescription>
              You're reserving this spot for 60 minutes. Please release it after Salah so others can use it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={reserve} disabled={busy}>Confirm reservation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SlotCard;
