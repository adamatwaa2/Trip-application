import {getEventTicketState} from "@/lib/event-ticket";
import {renderBookingConfirmationPdf} from "@/lib/booking-confirmation-pdf";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;const ticket=await getEventTicketState(token);
 if(!ticket||ticket.status!=="confirmed")return new Response("Ticket not available",{status:404,headers:{"Cache-Control":"private, no-store"}});
 const pdf=await renderBookingConfirmationPdf({bookingNumber:ticket.reference,bookingStatus:"Confirmed event ticket",paymentStatus:"Paid in full",issuedAt:ticket.issuedAt!,guestName:ticket.name,guestEmail:"Registered booking contact",additionalGuests:ticket.guests.filter(name=>name!==ticket.name),productType:"Event",productTitle:ticket.title,destination:ticket.venue,scheduledAt:ticket.date,returnAt:ticket.endDate,meetingPoint:"Exact location sent one day before the event",inclusions:["Event admission subject to door selection","Bring your original physical ID","Non-refundable and non-transferable, subject to applicable law"],exclusions:[],paidExtras:[{label:"Booking fees (included in total)",amount:ticket.fees}],bookingQuestions:[],guestCount:ticket.quantity,totalAmount:ticket.total,amountPaid:ticket.paid,currency:"EGP",siteUrl:process.env.NEXT_PUBLIC_SITE_URL??"https://planetinfinity.online"});
 return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${ticket.reference}-ticket.pdf"`,"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
}
