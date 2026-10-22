import Link from "next/link";
import type {EventTicketState} from "@/lib/event-ticket";

export function EventTicketAdminPanel({ticket,token,phone}:{ticket:EventTicketState;token:string;phone:string|null}){
 const ready=ticket.status==="confirmed";
 const site=(process.env.NEXT_PUBLIC_SITE_URL??"https://planetinfinity.online").replace(/\/$/,"");
 const statusUrl=site+"/pay/"+token;
 const pdfUrl=statusUrl+"/ticket";
 const number=(phone??"").replace(/\D/g,"").replace(/^0/,"20");
 const message=`Hi ${ticket.name}, your Planet Infinity Halloween ticket is ready.\n\n${ticket.reference}\n${ticket.quantity} guest${ticket.quantity===1?"":"s"} · 29 October · 7 PM–2 AM\n\nYour ticket: ${statusUrl}\nDownload PDF: ${pdfUrl}\n\nCostume is a must. Bring your original ID. Exact location sent two days before. See you on the other side!`;
 return <div><p className="pi-admin-help">{ready?"Full payment verified. The event ticket is ready on the customer's secure page.":"The ticket becomes available after full payment is verified. A screenshot alone does not issue a ticket."}</p><div className="pi-admin-confirmation-actions"><Link className="pi-admin-button pi-admin-button--secondary" href={statusUrl} target="_blank">View customer ticket</Link>{ready?<><a className="pi-admin-button" href={pdfUrl} download>Download event ticket PDF</a>{number?<a className="pi-admin-button" href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Send ticket on WhatsApp ↗</a>:null}</>:null}</div><p className="pi-admin-help">The WhatsApp button opens a ready-to-send message with the ticket and PDF links. Press Send in WhatsApp. Unattended delivery requires the WhatsApp Business connection, which is not configured yet.</p></div>;
}

