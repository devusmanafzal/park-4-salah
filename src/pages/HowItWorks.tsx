const steps = [
  {
    n: "01",
    title: "Create an account",
    body: "Sign up with your email so we know who's holding which spot. It takes about 30 seconds.",
  },
  {
    n: "02",
    title: "Check availability",
    body: "Open the app on your way to the mosque. You'll instantly see how many shared spots are free.",
  },
  {
    n: "03",
    title: "Reserve in one tap",
    body: "Pick a spot and it's held in your name for up to 60 minutes — long enough for Salah.",
  },
  {
    n: "04",
    title: "Park and pray",
    body: "Drive straight to the spot without circling the block. Arrive calm, not late.",
  },
  {
    n: "05",
    title: "Release for the next brother or sister",
    body: "Tap 'Release my slot' as soon as you leave. Reservations also expire automatically after 60 minutes.",
  },
];

const HowItWorks = () => {
  return (
    <section className="container max-w-3xl py-12 sm:py-20 px-4">
      <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">How it works</p>
      <h1 className="font-display text-3xl sm:text-5xl leading-[1.1] tracking-tight">
        A simple way to share parking around prayer time.
      </h1>
      <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
        Park for Salah is a community-run pool of parking spots near the mosque. Members donate the use of their spots, and worshippers can reserve one for the duration of a prayer.
      </p>

      <ol className="mt-10 sm:mt-12 space-y-8 sm:space-y-10">
        {steps.map((s) => (
          <li key={s.n} className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6">
            <span className="font-display text-2xl sm:text-3xl text-primary tabular-nums">{s.n}</span>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl mb-1.5 sm:mb-2">{s.title}</h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 sm:mt-16 p-5 sm:p-6 rounded-xl bg-primary-soft">
        <h3 className="font-display text-lg mb-2">Etiquette</h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Please respect the owner's spot — keep it clean, don't block driveways, and release the reservation as soon as you leave. This service runs on trust.
        </p>
      </div>
    </section>
  );
};

export default HowItWorks;
