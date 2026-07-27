import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WaitlistForm } from "@/components/forms";
import { PageHero } from "@/components/site";
import { publicSocialProof, waitlistProjects } from "@/lib/content";

type WaitlistPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ fromPost?: string }>;
};

export async function generateMetadata({ params }: WaitlistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = waitlistProjects[slug as keyof typeof waitlistProjects];

  return project
    ? {
        title: project.headline,
        description: project.subtitle,
        alternates: {
          canonical: `/waitlist/${project.slug}`
        },
        robots: {
          index: false,
          follow: false
        }
      }
    : {};
}

export default async function WaitlistPage({ params, searchParams }: WaitlistPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const project = waitlistProjects[slug as keyof typeof waitlistProjects];
  const fromPost = typeof resolvedSearchParams?.fromPost === "string" ? resolvedSearchParams.fromPost : undefined;

  if (!project) {
    notFound();
  }

  const fitItems = project.fitItems;
  const outcomeItems = project.outcomeItems;

  return (
    <>
      <PageHero
        eyebrow="Join the waitlist"
        title={project.headline}
        description={project.subtitle}
        aside={
          <WaitlistForm
            projectName={project.name}
            pageSlug={project.slug}
            sourcePage={fromPost ? `/research/${fromPost}` : `/waitlist/${project.slug}`}
            postSlug={fromPost}
          />
        }
      />

      <section className="container">
        <div className="feature-row">
          {fitItems.map((item) => (
            <div key={item.title} className="card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <h2>What this workflow will help you do</h2>
        <div className="grid-5">
          {outcomeItems.map((item) => (
            <div key={item} className="card">
              <h3>{item}</h3>
              <p>Practical steps designed for testing this workflow with real demand signals.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="quote-banner">
          <h3>Who this is for</h3>
          <p>{project.whoThisIsFor}</p>
          <p style={{ marginBottom: 0 }}>{publicSocialProof.newsletterJoinCopy}</p>
        </div>
      </section>
    </>
  );
}
