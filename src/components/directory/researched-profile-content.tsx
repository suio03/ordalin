import type { CheckedProfile, ProfileClaim, ProfileEvidence } from "@/lib/catalog-profile/contract";
import styles from "./tool-profile-content.module.css";

export function ResearchCitations({ evidence }: { evidence: ProfileEvidence[] }) {
  return <>{[...new Set(evidence.map(item => item.url))].map((url, index) => <span key={url}>{index ? " · " : " "}<a className={styles.citation} href={url} target="_blank" rel="noopener noreferrer">Official source {index + 1} ↗</a></span>)}</>;
}
function Claims({ items }: { items: ProfileClaim[] }) {
  return <>{items.map(item => <p key={item.text}>{item.text}<ResearchCitations evidence={item.evidence} /></p>)}</>;
}
function Unverified({ label }: { label: string }) {
  return <p>{label} were not established by the checked official sources.</p>;
}
export function ResearchedProfileContent({ profile }: { profile: CheckedProfile }) {
  return <div className={styles.content}>
    <section id="features" className={styles.section}>
      <h2>Features</h2>
      <ul className={styles.featureList}>{profile.features.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}<ResearchCitations evidence={item.evidence} /></li>)}</ul>
    </section>
    <section id="pricing" className={styles.section}>
      <h2>Pricing & free limits</h2>
      <div className={styles.plans}>{profile.plans.map(plan => <article className={styles.plan} key={plan.name}>
        <div className={styles.planHeader}><h3>{plan.name}</h3><span className={styles.price}>{plan.price}</span><span className={styles.cadence}>{plan.cadence}</span></div>
        <p>{plan.detail}<ResearchCitations evidence={plan.evidence} /></p>
      </article>)}</div>
      <h3>Billing details</h3>
      {profile.billingNotes.length ? <Claims items={profile.billingNotes} /> : <Unverified label="Billing details" />}
      <h3>Free access & limits</h3>
      {profile.freeLimits.length ? <Claims items={profile.freeLimits} /> : <Unverified label="Free access and its limits" />}
    </section>
    <section id="fit-and-limits" className={styles.section}>
      <h2>Best for & limitations</h2>
      <Claims items={profile.useCases} />
      {profile.limitations.length ? <ul className={styles.featureList}>{profile.limitations.map(item => <li key={item.title}><strong>{item.title}.</strong> {item.text}<ResearchCitations evidence={item.evidence} /></li>)}</ul> : <Unverified label="Product limitations" />}
    </section>
  </div>;
}
