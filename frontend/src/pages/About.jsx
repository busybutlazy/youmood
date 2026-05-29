import { aboutContent } from "@/data/marketing";

export default function About() {
  const { hero, story, values, process } = aboutContent;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[46vh] min-h-[340px] w-full overflow-hidden bg-foreground">
        <img
          src={hero.image}
          alt={hero.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/45" />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <h1 className="max-w-3xl text-center text-3xl font-semibold leading-snug text-cream md:text-5xl">
            {hero.title}
          </h1>
        </div>
      </section>

      {/* 我們的故事 */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold md:text-4xl">{story.title}</h2>
          <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
            {story.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-lg">
          <img
            src={story.image}
            alt={story.title}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </section>

      {/* 我們的理念 */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">
            {values.title}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {values.items.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border bg-card p-8"
              >
                <h3 className="text-xl font-semibold text-wood">
                  {item.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 製作過程 */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <h2 className="text-center text-3xl font-semibold md:text-4xl">
          {process.title}
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((s) => (
            <div key={s.step} className="text-center">
              <span className="font-serif text-4xl font-semibold text-wood-light">
                {s.step}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
