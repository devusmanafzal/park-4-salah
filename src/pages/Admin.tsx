import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Lock, Unlock } from "lucide-react";

type Slot = {
  id: string;
  slot_code: string;
  owner_name: string;
  description: string | null;
  picture_url: string | null;
  status: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  locked: boolean;
  created_at: string;
};

const Admin = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [code, setCode] = useState("");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: slotData }, { data: userData }] = await Promise.all([
      supabase.from("parking_slots").select("*").order("slot_code"),
      supabase.from("profiles").select("id, display_name, locked, created_at").order("created_at", { ascending: false }),
    ]);
    setSlots(slotData ?? []);
    setUsers(userData ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    const o = owner.trim();
    if (c.length < 1 || c.length > 20) return toast.error("Slot ID must be 1–20 characters.");
    if (o.length < 2 || o.length > 80) return toast.error("Owner name must be 2–80 characters.");
    if (description.length > 300) return toast.error("Description must be under 300 characters.");

    setBusy(true);
    let pictureUrl: string | null = null;

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setBusy(false);
        return toast.error("Image must be under 5 MB.");
      }
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("slot-pictures").upload(path, file);
      if (upErr) {
        setBusy(false);
        return toast.error("Could not upload picture.");
      }
      pictureUrl = supabase.storage.from("slot-pictures").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from("parking_slots").insert({
      slot_code: c,
      owner_name: o,
      description: description.trim() || null,
      picture_url: pictureUrl,
      status: "available",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "That Slot ID already exists." : "Could not save slot.");
      return;
    }
    toast.success("Parking slot added.");
    setCode(""); setOwner(""); setDescription(""); setFile(null);
    const picInput = document.getElementById("pic") as HTMLInputElement | null;
    if (picInput) picInput.value = "";
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this slot?")) return;
    const { error } = await supabase.from("parking_slots").delete().eq("id", id);
    if (error) toast.error("Could not delete.");
    else { toast.success("Slot deleted."); load(); }
  };

  const toggleLock = async (u: ProfileRow) => {
    const { error } = await supabase
      .from("profiles")
      .update({ locked: !u.locked })
      .eq("id", u.id);
    if (error) toast.error("Could not update user.");
    else {
      toast.success(u.locked ? "Account unlocked." : "Account locked.");
      load();
    }
  };

  return (
    <section className="container max-w-4xl py-10 sm:py-16 px-4">
      <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">Admin</p>
      <h1 className="font-display text-3xl sm:text-5xl leading-[1.1] tracking-tight mb-2">Manage</h1>
      <p className="text-muted-foreground mb-8 sm:mb-12 text-sm sm:text-base">Slots and members of the community pool.</p>

      <Tabs defaultValue="slots">
        <TabsList className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex mb-6">
          <TabsTrigger value="slots">Parking slots</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="slots" className="space-y-10">
          <Card className="p-5 sm:p-8 shadow-soft">
            <form onSubmit={submit} className="grid gap-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="code">Slot ID</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. A1" maxLength={20} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input id="owner" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. Yusuf Ali" maxLength={80} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Where is it? Any notes?" maxLength={300} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pic">Picture (optional)</Label>
                <Input id="pic" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <Button type="submit" disabled={busy} className="justify-self-start">
                {busy ? "Saving…" : "Add slot"}
              </Button>
            </form>
          </Card>

          <div>
            <h2 className="font-display text-xl sm:text-2xl mb-4 sm:mb-6">All slots ({slots.length})</h2>
            <div className="grid gap-3">
              {slots.map((s) => (
                <Card key={s.id} className="p-4 flex items-center gap-4 shadow-soft">
                  <div className="h-14 w-14 rounded-md bg-muted overflow-hidden shrink-0">
                    {s.picture_url && <img src={s.picture_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-base">Slot {s.slot_code}</span>
                      <Badge variant="secondary" className={s.status === "available" ? "bg-available text-available-foreground" : "bg-reserved text-reserved-foreground"}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{s.owner_name}{s.description ? ` · ${s.description}` : ""}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))}
              {slots.length === 0 && <p className="text-sm text-muted-foreground">No slots yet.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <h2 className="font-display text-xl sm:text-2xl mb-4 sm:mb-6">Members ({users.length})</h2>
          <div className="grid gap-3">
            {users.map((u) => (
              <Card key={u.id} className="p-4 flex items-center gap-3 shadow-soft">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-base truncate">{u.display_name ?? "Member"}</span>
                    {u.locked && <Badge variant="secondary" className="bg-reserved text-reserved-foreground">Locked</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <Button
                  variant={u.locked ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLock(u)}
                  className="gap-1.5"
                >
                  {u.locked ? <><Unlock className="h-4 w-4" /> Unlock</> : <><Lock className="h-4 w-4" /> Lock</>}
                </Button>
              </Card>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default Admin;
