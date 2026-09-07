# Park & Pray

A mobile-first community parking reservation page for today's prayers. The complete frontend is built as one self-contained file at `park-and-pray/index.html`. Supabase remains the shared online store so two visitors cannot reserve the same space.

## Update parking and prayer times

Edit `src/config/parking-slots.json`, then rebuild. The included times and parking spaces are examples and must be updated before launch.

```json
{
	"siteName": "Park & Pray",
	"communityName": "Upplands Väsby community",
	"timeZone": "Europe/Stockholm",
	"bookingClosesMinutesAfterPrayer": 30,
	"prayers": [
		{ "id": "fajr", "name": "Fajr", "time": "05:30" }
	],
	"slots": [
		{
			"id": "A1",
			"label": "Driveway A1",
			"owner": "Community member",
			"description": "First driveway on the left."
		}
	]
}
```

Keep every slot `id` stable and unique. Existing reservations refer to this ID. Prayer IDs must remain `fajr`, `dhuhr`, `asr`, `maghrib`, or `isha`, and times use 24-hour `HH:mm` format.

The current MVP intentionally uses descriptions instead of parking photographs. If photographs are added later, import them from source so Vite can embed them into the single HTML file; do not use remote image URLs if the artifact must remain self-contained.

## Supabase setup

1. Create or select a Supabase project.
2. Run all files in `supabase/migrations` in order, or link the Supabase CLI and run `supabase db push`.
3. In Supabase Dashboard, open **Authentication > Providers > Anonymous Sign-Ins** and enable anonymous users.
4. Add the project URL and publishable key to `.env`:

```dotenv
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

The publishable key is designed to be included in browser code. Never place a Supabase service-role key in this project.

The migration stores member names and phone numbers privately. Public clients receive only slot IDs and booking status. A booking is owned by the anonymous identity saved in that browser, so cancellation works from the same browser only. Operators can correct mistaken bookings from the Supabase Table Editor.

The server timezone in the migration and the JSON `timeZone` must match. Both currently use `Europe/Stockholm`.

## Develop and verify

```sh
bun install
bun run dev
bun test
bun run lint
bun run build
```

The production build empties and recreates `park-and-pray/`. It must contain exactly one file:

```text
park-and-pray/
	index.html
```

Upload that HTML file to any HTTPS static host. Shared reservations require internet access to Supabase even though the frontend itself is a single file.

## MVP boundaries

- Reservations cover one of today's prayers.
- Each browser may hold one space per prayer.
- No account, email confirmation, SMS verification, advance dates, or custom admin page.
- Names and phone numbers are not shown to other visitors.
- Prayer times are maintained manually in JSON and require rebuilding the HTML.
