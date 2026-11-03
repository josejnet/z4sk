import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = { title:"Safety Center · Z4SK", description:"Consent, link security, reporting and emergency guidance for Z4SK." };

export default function SafetyPage() { return <LegalPage kind="safety">
  <div className="safety-grid"><article><b>01</b><h2>Pause</h2><p>You never owe anyone an answer. Closing the page sends nothing.</p></article><article><b>02</b><h2>Check</h2><p>Confirm the sender and the exact Z4SK domain before typing.</p></article><article><b>03</b><h2>Report</h2><p>Use “Report invitation” without submitting written answers.</p></article></div>
  <h2>Before answering</h2><p>Only continue if you recognize the sender, understand who will read the answers and feel free to say no. Do not submit passwords, payment details, identity numbers, intimate images, medical records or anything that could seriously harm you if copied.</p>
  <h2>Protect access</h2><p>A complete invitation link is a bearer secret. If the creator enabled an optional shared key, the link and branded QR or 12 words must travel through different channels and never be posted together. The key ID is only an identifier and cannot unlock anything. The creator dashboard URL also contains authorization and response-decryption secrets. Z4SK support never asks for a real link or shared key.</p>
  <h2>Reporting</h2><p>The invitation screen includes “Report invitation”. Reports record a reason, approximate country and timestamp but not draft/written answers. Three reports automatically close an invitation. False or coordinated reports may be rate limited.</p>
  <h2>Minors and sexual content</h2><p>No Filter is 18+. Never send sexual questions to a minor or use Z4SK to groom, exploit, threaten or solicit intimate material. If you believe a child is at risk, stop interacting and contact the appropriate local child-protection or law-enforcement service.</p>
  <h2>Threats, coercion and immediate danger</h2><p>Do not confront someone through the app if doing so may increase danger. Preserve the public invitation URL and relevant external messages without forwarding private answers. Contact local emergency services or a trusted specialist organization when someone may be in immediate danger.</p>
  <h2>Privacy incident</h2><p>If a complete link may have been exposed, delete the invitation immediately, remove shared copies where possible and treat viewed content as compromised. If an enabled reusable shared key was exposed, replace it for future invitations. Existing invitations cannot be re-keyed: delete and recreate them.</p>
  <h2>What moderation cannot do</h2><p>Z4SK is not an emergency service and automated thresholds can miss abuse or close legitimate invitations. A complete human-review operation and dedicated safety contact must be established before wide public launch.</p>
</LegalPage>; }
