export type PasaloLocale="en"|"es"|"it"|"fr"|"de";
export type PasaloLevel="curioso"|"coqueto"|"picante"|"sinfiltro";
export type CreateQuizInput={creatorName:string;recipientName:string;locale?:PasaloLocale;level:PasaloLevel;questions:string[];viewOnce?:boolean;doubleBlind?:boolean;creatorInterest?:boolean;expiresInHours?:12|24|48|72;packSlug?:"original"|"nightlife"|"creator"};
export type CreatedQuiz={id:string;playUrl:string;adminUrl:string};
export class PasaloClient{
  constructor(private readonly baseUrl="https://pasalo.app"){}
  async createQuiz(input:CreateQuizInput):Promise<CreatedQuiz>{const response=await fetch(`${this.baseUrl}/api/games`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({...input,libraryVersion:"2026.08",source:"sdk"})});if(!response.ok)throw new Error(`Pásalo API returned ${response.status}`);return response.json() as Promise<CreatedQuiz>}
  mount(target:HTMLElement,options:{locale?:PasaloLocale;label?:string;height?:number}={}){const iframe=document.createElement("iframe");iframe.src=`${this.baseUrl}/?embed=1&locale=${options.locale||"en"}`;iframe.title=options.label||"Create a Pásalo questionnaire";iframe.loading="lazy";iframe.allow="clipboard-write; web-share";iframe.style.cssText=`width:100%;height:${options.height||760}px;border:0;background:#0b0b0b`;target.replaceChildren(iframe);return()=>iframe.remove()}
}
