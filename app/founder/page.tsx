import type { Metadata } from "next";
import { FounderDashboard } from "./FounderDashboard";
import "./founder.css";
import "./privacy.css";
export const metadata:Metadata={title:"Founder Dashboard · Z4SK",robots:{index:false,follow:false},openGraph:{images:[]},twitter:{images:[]}};
export default function FounderPage(){return <FounderDashboard showDevelopmentKey={process.env.NODE_ENV!=="production"}/>}
