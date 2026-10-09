"use server";
import { submitPublicRequest, type RequestActionResult } from "./requests";
import { SOCOTRA_ACTIVE_RATE, SOCOTRA_DEPARTURES, SOCOTRA_RATE, normalizeSocotraPhone, socotraEstimate } from "@/content/socotra";

export type SocotraGuest = { name:string;phone:string;nationality:string;passportCountry:string;passportExpiry:string };
export type SocotraRequestInput = { departure:string;count:number;city:string;country:string;email:string;guests:SocotraGuest[];connection:string;policyAccepted:boolean;requestAccepted:boolean };
const text = (value:unknown,max:number) => typeof value==='string' ? value.trim().slice(0,max) : '';
export async function submitSocotraRequest(input:SocotraRequestInput):Promise<RequestActionResult> {
 if(!input || !Number.isInteger(input.count)||input.count<1||input.count>80) return {ok:false,error:"Choose a valid number of travelers."};
 const departure=SOCOTRA_DEPARTURES.choices.find(date=>date.id===input.departure);
 if(!departure) return {ok:false,error:"Choose one of the proposed departures."};
 if(!input.policyAccepted||!input.requestAccepted) return {ok:false,error:"Accept the policies and request conditions before sending."};
 const city=text(input.city,120),country=text(input.country,80),email=text(input.email,254);
 if(!city||!country||!['help','own'].includes(input.connection)||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)) return {ok:false,error:"Check your departure location and contact email."};
 if(!Array.isArray(input.guests)||input.guests.length!==input.count) return {ok:false,error:"Enter details for each traveler."};
 const guests=input.guests.map(guest=>({name:text(guest?.name,120),phone:normalizeSocotraPhone(text(guest?.phone,40)),nationality:text(guest?.nationality,80),passportCountry:text(guest?.passportCountry,80),passportExpiry:text(guest?.passportExpiry,10)}));
 if(guests.some(guest=>{
   const expiry=new Date(`${guest.passportExpiry}T00:00:00Z`);
   return guest.name.length<2||!guest.phone||!guest.nationality||!guest.passportCountry||!/^\d{4}-\d{2}-\d{2}$/.test(guest.passportExpiry)||Number.isNaN(expiry.getTime())||expiry.toISOString().slice(0,10)!==guest.passportExpiry||guest.passportExpiry<=departure.id;
 })) return {ok:false,error:"Check each name, international phone number and valid passport expiry date."};
 const total=socotraEstimate(String(input.count));
 // The rate and total are generated on the server. No client price is accepted.
 return submitPublicRequest({requestType:"trip",externalSubjectId:"socotra-8-days",subjectSlug:"socotra",subjectTitle:"Socotra · 8 days",fullName:guests[0].name,email,phone:guests[0].phone,guestCount:input.count,scheduledAt:`${departure.id}T00:00:00Z`,termsAccepted:true,whatsappOptIn:false,
   selections:{bookingMode:"request",currency:"USD",estimatedTotalUsd:total,perPersonUsd:SOCOTRA_RATE[SOCOTRA_ACTIVE_RATE].amount,rate:SOCOTRA_ACTIVE_RATE,departureStatus:"proposed",departure:departure.label,connectionHelp:input.connection==='help',departureCity:city,departureCountry:country,guestRoster:guests,requestOnly:true,paymentCollected:false,customResponses:guests.map((guest,index)=>({label:`Traveler ${index+1}`,answer:[guest.name,guest.phone,`Nationality: ${guest.nationality}`,`Passport country: ${guest.passportCountry}`,`Passport expiry: ${guest.passportExpiry}`]}))},
   notes:"Socotra interest request. Confirm flights, availability, visa eligibility and applicable rate before accepting. No confirmed booking, payment or seat hold."});
}
