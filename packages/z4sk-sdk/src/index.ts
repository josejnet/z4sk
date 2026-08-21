export type Z4skLocale="en"|"es"|"it"|"fr"|"de"|"nl"|"eo"|"pt"|"ja"|"tr"|"machine";
export type Z4skLevel="curioso"|"coqueto"|"picante"|"sinfiltro";
export type CreateQuizInput={creatorName:string;creatorEmail:string;recipientName:string;locale?:Z4skLocale;level:Z4skLevel;questions:string[];viewOnce?:boolean;doubleBlind?:boolean;creatorInterest?:boolean;expiresInHours?:12|24|48|72;packSlug?:"original"|"nightlife"|"creator"};
export type CreatedQuiz={id:string;playUrl:string;adminUrl:string};
export class Z4skClient{
  constructor(private readonly baseUrl="https://z4sk.example"){}
  async createQuiz(input:CreateQuizInput):Promise<CreatedQuiz>{const response=await fetch(`${this.baseUrl}/api/games`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...input,libraryVersion:"2026.08",source:"sdk"})});if(!response.ok)throw new Error(`Z4SK API returned ${response.status}`);return response.json() as Promise<CreatedQuiz>}
  mount(target:HTMLElement,options:{locale?:Z4skLocale;label?:string;height?:number}={}){const iframe=document.createElement("iframe");iframe.src=`${this.baseUrl}/?embed=1&locale=${options.locale||"en"}`;iframe.title=options.label||"Create a Z4SK questionnaire";iframe.loading="lazy";iframe.allow="clipboard-write; web-share";iframe.style.cssText=`width:100%;height:${options.height||760}px;border:0;background:#0b0b0b`;target.replaceChildren(iframe);return()=>iframe.remove()}
}
