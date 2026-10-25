"use server";
import {validateAssembleRequest,type AssembleRequestInput} from "@/content/assemble-registration";
import {submitPublicRequest,type RequestActionResult} from "./requests";
/** Early-interest intake only: no price, confirmed date, seat hold or payment. */
export async function submitAssembleRequest(input:AssembleRequestInput):Promise<RequestActionResult>{
 const error=validateAssembleRequest(input);if(error)return {ok:false,error};
 return submitPublicRequest({requestType:"event",externalSubjectId:"3b46a8c5-edb7-4516-a60e-73f6407f26b9",subjectSlug:"assemble",subjectTitle:"ASSEMBLE — Avengers-inspired event interest",fullName:input.fullName,email:input.email,phone:input.phone,guestCount:input.guestCount,termsAccepted:true,whatsappOptIn:false,notes:input.notes,selections:{kind:"assemble-event-interest",heroInspiration:input.hero,groupSize:input.guestCount,requestStage:"Early interest — not a confirmed booking",paymentRequired:false}});
}
