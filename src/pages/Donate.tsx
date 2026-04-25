import { Heart } from "lucide-react";

const Donate = () => {
  return (
    <section className="container max-w-3xl py-12 sm:py-20 px-4">
      <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-muted-foreground mb-3">Support the project</p>
      <h1 className="font-display text-3xl sm:text-5xl leading-[1.1] tracking-tight">
        Donate to keep Park for Salah running.
      </h1>
      <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed">
        This service is built and maintained for the community, free of charge. Your sadaqah helps cover hosting, maintenance, and growing the network of shared parking spots.
      </p>

      <div className="mt-10 sm:mt-12 grid gap-4">
        <div className="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-soft">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center text-primary shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg mb-1">Donation details coming soon</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're setting up our donation channels. Please check back shortly — bank transfer, PayPal and other options will appear here.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-xl border border-dashed border-border">
          <h3 className="font-display text-base mb-2">Other ways to help</h3>
          <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <li>• Share your own driveway or parking spot — contact the admin to add it.</li>
            <li>• Tell the community about Park for Salah.</li>
            <li>• Make du'a for everyone who contributes.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default Donate;
