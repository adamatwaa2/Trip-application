"use server";
import {validateArenaRequest,type ArenaRequestInput} from "@/content/arena-request";
import {submitPublicRequest,type RequestActionResult} from "./requests";
export async function submitArenaInterest(input:ArenaRequestInput):Promise<RequestActionResult>{
 const invalid=validateArenaRequest(input);if(invalid)return {ok:false,error:invalid};
 return submitPublicRequest({requestType:"event",externalSubjectId:"d164fbe9-56e4-429d-a12c-365f12842d4b",subjectSlug:`arena-${input.role}-interest`,subjectTitle:`ARENA — ${input.role} interest`,fullName:input.fullName,email:input.email,phone:input.phone,guestCount:1,termsAccepted:true,whatsappOptIn:false,notes:input.notes,selections:{kind:"arena-concept-interest",role:input.role,adultConfirmed:input.role==="participant"?input.adult:null,stage:"Development interest only — not casting acceptance or a viewer pass",paymentRequired:false}});
}
