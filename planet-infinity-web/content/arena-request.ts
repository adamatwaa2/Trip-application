export const ARENA_ROLES=["participant","viewer","partner","community"] as const;
export type ArenaRole=(typeof ARENA_ROLES)[number];
export type ArenaRequestInput={role:string;fullName:string;email:string;phone:string;notes:string;adult:boolean;consent:boolean;website:string};
export function validateArenaRequest(input:ArenaRequestInput):string|null{
 if(!input||typeof input!=="object")return "Please check your interest details.";
 if(typeof input.website!=="string"||input.website)return "Your interest could not be sent. Please try again.";
 if(!ARENA_ROLES.some(role=>role===input.role))return "Choose how you want to be involved.";
 if(input.role==="participant"&&input.adult!==true)return "Participant interest is currently for adults aged 18 and over.";
 if(typeof input.fullName!=="string"||input.fullName.trim().length<2||input.fullName.length>120)return "Enter your full name.";
 if(typeof input.email!=="string"||input.email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim()))return "Enter a valid email address.";
 if(typeof input.phone!=="string"||input.phone.length>40||!/^[+\d\s().-]+$/.test(input.phone)||input.phone.replace(/\D/g,"").length<8)return "Enter a valid mobile number.";
 if(typeof input.notes!=="string"||input.notes.length>2000)return "Keep your message under 2,000 characters.";
 if(input.consent!==true)return "Accept the required policies before sending.";
 return null;
}
