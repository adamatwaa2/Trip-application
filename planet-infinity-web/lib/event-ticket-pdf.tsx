import "server-only";
import {Document,Page,Text,View,StyleSheet,renderToBuffer} from "@react-pdf/renderer";
import type {EventTicketState} from "./event-ticket";
const s=StyleSheet.create({
 page:{backgroundColor:"#11120f",padding:26,fontFamily:"Helvetica",color:"#eee9de"},
 brand:{fontSize:8,letterSpacing:2,color:"#b9c8a5",marginBottom:28},
 card:{backgroundColor:"#f1ecdf",color:"#161a12",padding:26,borderTopWidth:4,borderTopColor:"#dfab7c"},
 kicker:{fontSize:8,letterSpacing:2,color:"#667355",marginBottom:25},
 title:{fontSize:43,fontFamily:"Helvetica-Bold",lineHeight:.95,letterSpacing:-2,marginBottom:22},
 date:{fontSize:11,fontFamily:"Helvetica-Bold",marginBottom:6},
 venue:{fontSize:10,color:"#59644e",marginBottom:25},
 divider:{borderTopWidth:1,borderTopColor:"#a5aa98",borderTopStyle:"dashed",marginBottom:22},
 row:{flexDirection:"row",justifyContent:"space-between",marginBottom:22,gap:14},
 label:{fontSize:7,letterSpacing:1.2,color:"#67725b",marginBottom:7},
 value:{fontSize:12,fontFamily:"Helvetica-Bold"},
 reference:{fontSize:14,fontFamily:"Helvetica-Bold",letterSpacing:1},
 note:{fontSize:8,lineHeight:1.6,color:"#59644e",marginTop:20},
 footer:{fontSize:7,color:"#9ba58e",letterSpacing:1.5,marginTop:20}
});
export async function renderEventTicketPdf(ticket:EventTicketState){
 const date=ticket.date?new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",day:"numeric",month:"long",year:"numeric"}).format(new Date(ticket.date)):"Date to be confirmed";
 const timeFormatter=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Cairo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
 const hours=[ticket.date,ticket.endDate].filter((value):value is string=>Boolean(value)).map(value=>timeFormatter.format(new Date(value))).join(" - ");
 return renderToBuffer(<Document title={ticket.title+" | "+ticket.reference} author="Planet Infinity"><Page size="A5" style={s.page}><Text style={s.brand}>PLANET INFINITY</Text><View style={s.card}><Text style={s.kicker}>YOUR NIGHT. YOUR INVITATION.</Text><Text style={s.title}>{ticket.title.toUpperCase()}</Text><Text style={s.date}>{date}{hours ? ` / ${hours}` : ""}</Text><Text style={s.venue}>{ticket.venue}</Text><View style={s.divider}/><View style={s.row}><View><Text style={s.label}>BOOKING CONTACT</Text><Text style={s.value}>{ticket.name}</Text></View><View><Text style={s.label}>ADMIT</Text><Text style={s.value}>{String(ticket.quantity).padStart(2,"0")}</Text></View></View><Text style={s.label}>CONFIRMED / GENERAL ADMISSION</Text><Text style={s.reference}>{ticket.reference}</Text><Text style={s.note}>Bring your original physical ID. Costume is a must. Door selection applies. Exact location sent one day before the event.</Text></View><Text style={s.footer}>ONE NIGHT. ANOTHER WORLD.</Text></Page></Document>);
}
