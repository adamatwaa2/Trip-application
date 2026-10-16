import {getEventTicketState} from "@/lib/event-ticket";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const state=await getEventTicketState((await params).token);
 return Response.json(state??{error:"Not found"},{status:state?200:404,headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});
}
