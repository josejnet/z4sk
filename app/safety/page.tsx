import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title:"Safety Center · Z4SK", description:"Consent, link security, reporting and emergency guidance for Z4SK." };

export default function SafetyPage() { return <LegalPage kind="safety">
  <div className="safety-grid"><article><b>01</b><h2>Pause</h2><p>You never owe anyone an answer. Closing the page sends nothing.</p></article><article><b>02</b><h2>Check</h2><p>Confirm the sender and the exact Z4SK domain before typing.</p></article><article><b>03</b><h2>Report</h2><p>Use “Report invitation” without submitting written answers.</p></article></div>
  <h2>Before answering</h2><p>Only continue if you recognize the sender, understand who will read the answers and feel free to say no. Do not submit passwords, payment details, identity numbers, intimate images, medical records or anything that could seriously harm you if copied.</p>
  <h2>Protect creator access</h2><p>The creator dashboard URL works like a password and includes a secret key. Do not post, forward, screenshot or paste it into analytics, support tickets or public chats. Z4SK never asks a recipient for this key.</p>
  <h2>Double blind is limited protection</h2><p>The interest choice is revealed as a match only if both people say yes. This reduces one kind of social pressure; it is not proof of identity, age, safety or consent to anything beyond that choice.</p>
  <h2>Reporting</h2><p>The invitation screen includes “Report invitation”. Reports record a reason, approximate country and timestamp but not draft/written answers. Three reports automatically close an invitation. False or coordinated reports may be rate limited.</p>
  <h2>Minors and sexual content</h2><p>No Filter is 18+. Never send sexual questions to a minor or use Z4SK to groom, exploit, threaten or solicit intimate material. If you believe a child is at risk, stop interacting and contact the appropriate local child-protection or law-enforcement service.</p>
  <h2>Threats, coercion and immediate danger</h2><p>Do not confront someone through the app if doing so may increase danger. Preserve the public invitation URL and relevant external messages without forwarding private answers. Contact local emergency services or a trusted specialist organization when someone may be in immediate danger.</p>
  <h2>Privacy incident</h2><p>If a private creator link was exposed, use it to delete the invitation immediately, remove it from shared messages where possible and treat any viewed answers as compromised. The current recovery mechanism is deletion and recreation; individual creator keys cannot yet be rotated.</p>
  <h2>What moderation cannot do</h2><p>Z4SK is not an emergency service and automated thresholds can miss abuse or close legitimate invitations. A complete human-review operation and dedicated safety contact must be established before wide public launch.</p>
</LegalPage>; }
