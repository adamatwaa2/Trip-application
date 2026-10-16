import {getEventTicketState} from "@/lib/event-ticket";
import {renderEventTicketPdf} from "@/lib/event-ticket-pdf";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;const ticket=await getEventTicketState(token);
 if(!ticket||ticket.status!=="confirmed")return new Response("Ticket not available",{status:404,headers:{"Cache-Control":"private, no-store"}});
 const pdf=await renderEventTicketPdf(ticket);
 return new Response(new Uint8Array(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${ticket.reference}-ticket.pdf"`,"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
}
