"use client";

import { useEffect, useState } from "react";

type Proof = { generatedAt:string; overall:"pass"|"attention"; checks:{id:string;label:string;pass:boolean;evidence:string}[]; retention:{cron:string;providerRecoveryWindow:string;totalDeletedResponses:number}; limits:string[] };

export function PrivacyProof() {
  const [proof, setProof] = useState<Proof | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/privacy-proof", { cache:"no-store" }).then(async (response) => { const result = await response.json() as Proof & {error?:string}; if (!response.ok) throw new Error(result.error); setProof(result); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Proof unavailable.")); }, []);
  return <section className="proof-block" id="proof"><div className="proof-heading"><div><span className="eyebrow">LIVE PRIVACY PROOF</span><h2>Trust, but verify.</h2></div>{proof&&<strong className={proof.overall==="pass"?"proof-pass":"proof-attention"}>{proof.overall==="pass"?"● ALL ACTIVE CHECKS PASS":"● CHECK NEEDED"}</strong>}</div>{!proof&&!error&&<p>Running live checks against the active database…</p>}{error&&<p className="proof-error">{error}</p>}{proof&&<><div className="proof-grid">{proof.checks.map((check)=><article key={check.id}><span>{check.pass?"✓":"!"}</span><div><b>{check.label}</b><p>{check.evidence}</p></div></article>)}</div><div className="proof-retention"><div><small>LAST VERIFIED</small><b>{new Date(proof.generatedAt).toLocaleString("en-US")}</b></div><div><small>AUTOMATIC PURGE</small><b>{proof.retention.cron}</b></div><div><small>RESPONSES PURGED</small><b>{proof.retention.totalDeletedResponses}</b></div></div><details><summary>What this proof cannot prove</summary><ul>{proof.limits.map((limit)=><li key={limit}>{limit}</li>)}</ul><p>{proof.retention.providerRecoveryWindow}.</p></details><a className="proof-json" href="/api/privacy-proof" target="_blank" rel="noopener noreferrer">View server JSON evidence →</a></>}</section>;
}
