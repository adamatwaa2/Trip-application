import "server-only";
import {createServiceClient,isSupabaseServiceConfigured} from "@/lib/supabase/service";

export type EventTicketState={reference:string;title:string;name:string;guests:string[];quantity:number;date:string|null;endDate:string|null;venue:string;ticketLabel:string;subtotal:number;fees:number;total:number;paid:number;status:"confirmed"|"pending"|"unpaid"|"cancelled";issuedAt:string|null};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getEventTicketState(token:string):Promise<EventTicketState|null>{
 if(!UUID.test(token)||!isSupabaseServiceConfigured())return null;
 const {data,error}=await createServiceClient().from("bookings").select("booking_number,status,guest_count,scheduled_at,total_amount,amount_paid,selections,event_ticket_issued_at,customer:customers(full_name),event:events(title,slug,venue,starts_at,ends_at),guests:booking_guests(full_name),payments(status,payment_proof_path)").eq("payment_token",token).eq("booking_type","event").maybeSingle();
 if(error||!data)return null;
 const row=data as unknown as {booking_number:string;status:string;guest_count:number;scheduled_at:string|null;total_amount:number;amount_paid:number;selections:Record<string,unknown>;event_ticket_issued_at:string|null;customer:{full_name:string}|null;event:{title:string;slug:string;venue:string|null;starts_at:string|null;ends_at:string|null}|null;guests:{full_name:string}[];payments:{status:string;payment_proof_path:string|null}[]};
 if(row.event?.slug!=="halloween-party-2026")return null;
 const ready=row.status==="confirmed"&&Number(row.amount_paid)>=Number(row.total_amount)&&(Number(row.total_amount)>0||row.selections?.complimentaryAmbassador===true)&&Boolean(row.event_ticket_issued_at);
 const pending=row.payments.some(p=>p.status==="pending"&&Boolean(p.payment_proof_path));
 return {reference:row.booking_number,title:row.event.title,name:row.customer?.full_name??"Guest",guests:row.guests.map(g=>g.full_name),quantity:row.guest_count,date:row.event.starts_at??row.scheduled_at,endDate:row.event.ends_at,venue:row.event.venue??"Cairo · Secret location",ticketLabel:String(row.selections?.ticketLabel??"General admission"),subtotal:Number(row.selections?.ticketSubtotalEgp??row.total_amount),fees:Number(row.selections?.bookingFeesEgp??0),total:Number(row.total_amount),paid:Number(row.amount_paid),status:row.status==="cancelled"?"cancelled":ready?"confirmed":pending?"pending":"unpaid",issuedAt:row.event_ticket_issued_at};
}
