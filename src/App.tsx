import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CarFront, Check, ChevronRight, Clock3, Loader2, MapPin, Phone, RefreshCw, UserRound, X } from "lucide-react";
import Logo from "@/components/Logo";
import { ParkingSlot, siteConfig } from "@/config/site-config";
import { ensureAnonymousSession, supabase } from "@/integrations/supabase/client";
import { chooseDefaultPrayer, formatPrayerTime, isPrayerBookable } from "@/lib/prayer-time";

type Availability = { slot_id: string; is_mine: boolean; reservation_id: string | null };
const CONTACT_KEY = "park-and-pray-contact";

function readContact() {
  try {
    return JSON.parse(localStorage.getItem(CONTACT_KEY) ?? "{}") as { name?: string; phone?: string };
  } catch {
    return {};
  }
}

function App() {
  const defaultPrayer = chooseDefaultPrayer(siteConfig.prayers, new Date(), siteConfig.timeZone, siteConfig.bookingClosesMinutesAfterPrayer);
  const [prayerId, setPrayerId] = useState(defaultPrayer.id);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [name, setName] = useState(() => readContact().name ?? "");
  const [phone, setPhone] = useState(() => readContact().phone ?? "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const selectedPrayer = siteConfig.prayers.find((prayer) => prayer.id === prayerId) ?? defaultPrayer;

  const loadAvailability = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      await ensureAnonymousSession();
      const { data, error: requestError } = await supabase.rpc("get_prayer_availability", { p_prayer_id: prayerId });
      if (requestError) throw requestError;
      setAvailability(data ?? []);
    } catch {
      setError("Bookings could not be loaded. Check your connection and try again.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [prayerId]);

  useEffect(() => {
    void loadAvailability();
    const interval = window.setInterval(() => void loadAvailability(true), 30000);
    const refreshOnFocus = () => void loadAvailability(true);
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [loadAvailability]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const reservedBySlot = useMemo(() => new Map(availability.map((reservation) => [reservation.slot_id, reservation])), [availability]);
  const availableCount = error ? null : siteConfig.slots.filter((slot) => !reservedBySlot.has(slot.id)).length;

  const reserve = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSlot || name.trim().length < 2 || phone.replace(/\D/g, "").length < 7) {
      setError("Enter your name and a valid phone number.");
      return;
    }
    setBusy(true);
    setError("");
    const { error: requestError } = await supabase.rpc("reserve_prayer_slot", {
      p_slot_id: selectedSlot.id,
      p_prayer_id: prayerId,
      p_reserver_name: name.trim(),
      p_reserver_phone: phone.trim(),
    });
    setBusy(false);
    if (requestError) {
      setError(requestError.message.includes("ALREADY_BOOKED_PRAYER")
        ? "You already have a parking slot for this prayer."
        : requestError.message.includes("SLOT_TAKEN")
          ? "That slot was just reserved by someone else. Please choose another."
          : "We could not complete the booking. Please try again.");
      await loadAvailability(true);
      return;
    }
    localStorage.setItem(CONTACT_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
    const bookedLabel = selectedSlot.label;
    setSelectedSlot(null);
    setNotice(`${bookedLabel} is reserved for ${selectedPrayer.name}.`);
    await loadAvailability(true);
  };

  const cancel = async (reservationId: string) => {
    if (!window.confirm("Cancel this parking reservation?")) return;
    setBusy(true);
    const { data, error: requestError } = await supabase.rpc("cancel_prayer_reservation", { p_reservation_id: reservationId });
    setBusy(false);
    if (requestError || !data) setError("This reservation could not be cancelled.");
    else {
      setNotice("Your parking slot is available again.");
      await loadAvailability(true);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar"><Logo className="brand" /><span className="today-label">Today</span></header>
      <main>
        <section className="intro">
          <p className="eyebrow">{siteConfig.communityName}</p>
          <h1>Park. Pray. Make space.</h1>
          <p>Choose a prayer, then reserve the nearest available spot.</p>
        </section>

        <section className="prayer-section" aria-labelledby="prayer-heading">
          <div className="section-heading"><div><span className="step">1</span><h2 id="prayer-heading">Choose prayer</h2></div><Clock3 aria-hidden="true" /></div>
          <div className="prayer-tabs" role="tablist" aria-label="Today's prayers">
            {siteConfig.prayers.map((prayer) => {
              const bookable = isPrayerBookable(prayer, new Date(), siteConfig.timeZone, siteConfig.bookingClosesMinutesAfterPrayer);
              return <button key={prayer.id} type="button" role="tab" aria-selected={prayer.id === prayerId} disabled={!bookable} className={prayer.id === prayerId ? "prayer-tab active" : "prayer-tab"} onClick={() => setPrayerId(prayer.id)}>
                <strong>{prayer.name}</strong><span>{formatPrayerTime(prayer.time)}</span>
              </button>;
            })}
          </div>
        </section>

        <section className="slots-section" aria-labelledby="slots-heading">
          <div className="section-heading sticky-heading"><div><span className="step">2</span><h2 id="slots-heading">Choose parking</h2></div><span className="availability-count">{availableCount === null ? "Status unavailable" : `${availableCount} available`}</span></div>
          {error && !selectedSlot && <div className="status-message error" role="alert"><span>{error}</span><button type="button" onClick={() => void loadAvailability()} aria-label="Retry"><RefreshCw /></button></div>}
          {notice && <div className="status-message success" role="status"><Check /> {notice}</div>}
          {loading ? <div className="loading-state"><Loader2 className="spin" /> Checking spaces...</div> : (
            <div className="slot-list">
              {siteConfig.slots.map((slot) => {
                const reservation = reservedBySlot.get(slot.id);
                const isMine = reservation?.is_mine;
                return <article className={reservation ? "slot-row reserved" : "slot-row"} key={slot.id}>
                  <div className="slot-icon"><CarFront aria-hidden="true" /></div>
                  <div className="slot-copy">
                    <div className="slot-title-line"><h3>{slot.label}</h3><span className={reservation || error ? "slot-status taken" : "slot-status"}>{error ? "Unknown" : isMine ? "Yours" : reservation ? "Reserved" : "Available"}</span></div>
                    <p><MapPin aria-hidden="true" /> {slot.description}</p>
                  </div>
                  {isMine && reservation?.reservation_id
                    ? <button className="cancel-button" type="button" onClick={() => void cancel(reservation.reservation_id!)} disabled={busy}>Cancel</button>
                    : <button className="book-button" type="button" onClick={() => { setError(""); setSelectedSlot(slot); }} disabled={!!reservation || !!error} aria-label={`Reserve ${slot.label}`}><span>Book</span><ChevronRight aria-hidden="true" /></button>}
                </article>;
              })}
            </div>
          )}
        </section>
      </main>
      <footer>Parking shared with care for Salah.</footer>

      {selectedSlot && <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setSelectedSlot(null); }}>
        <section className="booking-sheet" role="dialog" aria-modal="true" aria-labelledby="booking-title">
          <div className="sheet-handle" /><button className="close-button" type="button" onClick={() => setSelectedSlot(null)} disabled={busy} aria-label="Close"><X /></button>
          <p className="eyebrow">{selectedPrayer.name} at {formatPrayerTime(selectedPrayer.time)}</p>
          <h2 id="booking-title">Reserve {selectedSlot.label}</h2>
          <p className="sheet-description">Your details stay private and help the parking host reach you if needed.</p>
          <form onSubmit={reserve}>
            <label><span>Your name</span><div className="input-wrap"><UserRound /><input autoFocus value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} required /></div></label>
            <label><span>Mobile number</span><div className="input-wrap"><Phone /><input type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" maxLength={30} required /></div></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="confirm-button" type="submit" disabled={busy}>{busy ? <><Loader2 className="spin" /> Reserving...</> : <>Confirm reservation <ChevronRight /></>}</button>
            <p className="privacy-note">This reservation can be cancelled from this phone.</p>
          </form>
        </section>
      </div>}
    </div>
  );
}

export default App;
