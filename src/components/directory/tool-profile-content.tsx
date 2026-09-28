import type { ProfileSource, ToolProfile } from "@/content/tool-profiles/granola";
import styles from "./tool-profile-content.module.css";

export function ProfileCitation({ profile, source }: { profile: ToolProfile; source: ProfileSource }) {
  const evidence = profile.sources[source];
  return <a className={styles.citation} href={evidence.url} target="_blank" rel="noopener noreferrer">{evidence.label} ↗</a>;
}

export function ToolProfileContent({ profile }: { profile: ToolProfile }) {
  return (
    <div className={styles.content}>
      <section id="features" className={styles.section}>
        <h2>Features</h2>
        <ul className={styles.featureList}>
          {profile.features.map((item) => <li key={item.title}>
            <strong>{item.title}.</strong> {item.text} <ProfileCitation profile={profile} source={item.source} />
          </li>)}
        </ul>
      </section>

      <section id="pricing" className={styles.section}>
        <h2>Pricing & free limits</h2>
        <div className={styles.plans}>
          {profile.plans.map((plan) => <article className={styles.plan} key={plan.name}>
            <div className={styles.planHeader}><h3>{plan.name}</h3><span className={styles.price}>{plan.price}</span><span className={styles.cadence}>{plan.cadence}</span></div>
            <p>{plan.detail}</p>
          </article>)}
        </div>
        <p className={styles.billingNote}>{profile.billingNote} <ProfileCitation profile={profile} source="pricing" /> · <ProfileCitation profile={profile} source="billing" /></p>
        <p className={styles.freeLimit}><strong>Free history limit.</strong> {profile.freeLimit}</p>
      </section>

      <section id="fit-and-limits" className={styles.section}>
        <h2>Best for & limitations</h2>
        <p>{profile.bestFor}</p>
        <ul className={styles.featureList}>
          {profile.limitations.map((item) => <li key={item.title}>
            {item.text} <ProfileCitation profile={profile} source={item.source} />
            {"additionalSource" in item ? <> · <ProfileCitation profile={profile} source={item.additionalSource} /></> : null}
          </li>)}
        </ul>
      </section>
    </div>
  );
}

export function ToolProfileNav({ mobile = false }: { mobile?: boolean }) {
  return <nav className={`${styles.contentsNav} ${mobile ? styles.mobileNav : ""}`} aria-label="On this page">
    <h2>On this page</h2>
    <a href="#features">Features</a><a href="#pricing">Pricing & free limits</a><a href="#fit-and-limits">Best for & limitations</a>
  </nav>;
}
