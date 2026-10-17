export const EVENT_SALES_VIEWS=[['overview','Overview'],['bookings','Bookings'],['partners','Partners & Codes'],['pricing','Pricing Settings']] as const;
export type EventSalesView=typeof EVENT_SALES_VIEWS[number][0];
export type EventSalesSearch={view?:string;code?:string;offset?:string;applicationsOffset?:string};
export function salesOffset(value?:string){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(1000000,Math.floor(n))):0;}
export function resolveSalesView(search:EventSalesSearch):EventSalesView{
 if(EVENT_SALES_VIEWS.some(([view])=>view===search.view))return search.view as EventSalesView;
 // Keep old bookmarked filters and pagination links useful.
 if(search.code||search.offset)return 'bookings';
 if(search.applicationsOffset)return 'partners';
 return 'overview';
}
export function eventSalesHref(view:EventSalesView,search:EventSalesSearch={}){
 const query=new URLSearchParams({view});
 if(view==='bookings'){
  if(search.code?.trim())query.set('code',search.code.trim().toUpperCase());
  if(salesOffset(search.offset))query.set('offset',String(salesOffset(search.offset)));
 }
 if(view==='partners'&&salesOffset(search.applicationsOffset))query.set('applicationsOffset',String(salesOffset(search.applicationsOffset)));
 return `/admin/ambassadors?${query}`;
}
