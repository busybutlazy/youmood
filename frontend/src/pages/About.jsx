import { aboutContent } from "@/data/marketing";
import { usePageTitle } from "@/lib/usePageTitle";
import { EditableText, EditableImage } from "@/components/Editable";
import { useSiteContent } from "@/hooks/useSiteContent";

const PIPE_HINT = "每行一項，格式：標題|說明內容";

function parsePipeList(str) {
  return str
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf("|");
      if (idx === -1) return { title: line.trim(), description: "" };
      return {
        title: line.slice(0, idx).trim(),
        description: line.slice(idx + 1).trim(),
      };
    });
}

export default function About() {
  usePageTitle("關於我們");
  const { hero, story, values, process } = aboutContent;

  const defaultValues = values.items
    .map(({ title, description }) => `${title}|${description}`)
    .join("\n");

  const defaultProcess = process.steps
    .map(({ title, description }) => `${title}|${description}`)
    .join("\n");

  const { content, updateText, updateImage } = useSiteContent("about", {
    story: story.paragraphs.join("\n\n"),
    photo: story.image,
    values: defaultValues,
    process: defaultProcess,
  });

  const storyParagraphs = (content.story || "").split("\n").filter(Boolean);
  const valueItems = parsePipeList(content.values || defaultValues);
  const processItems = parsePipeList(content.process || defaultProcess);

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
          <EditableText
            value={content.story}
            onSave={(v) => updateText("story", v)}
            multiline
          >
            <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
              {storyParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </EditableText>
        </div>

        <EditableImage onSave={(file) => updateImage("photo", file)}>
          <div className="overflow-hidden rounded-lg">
            <img
              src={content.photo}
              alt={story.title}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </EditableImage>
      </section>

      {/* 我們的理念 */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <h2 className="text-center text-3xl font-semibold md:text-4xl">
            {values.title}
          </h2>
          <EditableText
            value={content.values}
            onSave={(v) => updateText("values", v)}
            multiline
            hint={PIPE_HINT}
          >
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {valueItems.map((item, i) => (
                <div
                  key={i}
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
          </EditableText>
        </div>
      </section>

      {/* 製作過程 */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <h2 className="text-center text-3xl font-semibold md:text-4xl">
          {process.title}
        </h2>
        <EditableText
          value={content.process}
          onSave={(v) => updateText("process", v)}
          multiline
          hint={PIPE_HINT}
        >
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {processItems.map((item, i) => (
              <div key={i} className="text-center">
                <span className="font-serif text-4xl font-semibold text-wood-light">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </EditableText>
      </section>
    </div>
  );
}
