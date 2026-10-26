"use server";
import {validateDuneRequest,type DuneRequestInput} from "@/content/dune-request";
import {submitPublicRequest,type RequestActionResult} from "./requests";
export async function submitDuneRequest(input:DuneRequestInput):Promise<RequestActionResult>{
 const error=validateDuneRequest(input);if(error)return {ok:false,error};
 return submitPublicRequest({requestType:"trip",externalSubjectId:"d556b9c5-4113-4a64-9f48-25c2c3c6d0c4",subjectSlug:"dune-siwa-interest",subjectTitle:"DUNE — Siwa journey interest",fullName:input.fullName,email:input.email,phone:input.phone,guestCount:input.guestCount,termsAccepted:true,whatsappOptIn:false,notes:input.notes,selections:{kind:"dune-journey-interest",drawnTo:input.interest,groupSize:input.guestCount,requestStage:"Early interest — not a confirmed booking",paymentRequired:false}});
}
