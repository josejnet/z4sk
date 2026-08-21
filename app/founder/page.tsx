import type { Metadata } from "next";
import { FounderDashboard } from "./FounderDashboard";
import "./founder.css";
export const metadata:Metadata={title:"Founder Dashboard · Pásalo",robots:{index:false,follow:false},openGraph:{images:[]},twitter:{images:[]}};
export default function FounderPage(){return <FounderDashboard/>}
