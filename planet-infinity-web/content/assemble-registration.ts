export const ASSEMBLE_HEROES=[{name:"Iron Man",line:"Inventive. Bold. Always one idea ahead.",symbol:"◎"},{name:"Captain America",line:"Loyal. Determined. Team first.",symbol:"☆"},{name:"Thor",line:"Big energy. A little thunder.",symbol:"ϟ"},{name:"Black Widow",line:"Sharp instincts. Quiet confidence.",symbol:"◇"},{name:"Hulk",line:"A big heart. Unstoppable energy.",symbol:"✦"},{name:"My own hero",line:"An original character—or decide later.",symbol:"+"}];
export type AssembleRequestInput={hero:string;guestCount:number;fullName:string;email:string;phone:string;notes:string;consent:boolean;website:string};
export function validateAssembleRequest(input:AssembleRequestInput):string|null{
 if(!input||typeof input!=="object")return "Please check your request details.";
 if(typeof input.website!=="string"||input.website)return "Your request could not be sent. Please try again.";
 if(typeof input.hero!=="string"||!ASSEMBLE_HEROES.some(hero=>hero.name===input.hero))return "Choose an Avengers character or your own hero.";
 if(!Number.isInteger(input.guestCount)||input.guestCount<1||input.guestCount>100)return "Enter a group size between 1 and 100.";
 if(typeof input.fullName!=="string"||input.fullName.trim().length<2||input.fullName.length>120)return "Enter your full name.";
 if(typeof input.email!=="string"||input.email.length>254||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim()))return "Enter a valid email address.";
 if(typeof input.phone!=="string"||input.phone.length>40||!/^[+\d\s().-]+$/.test(input.phone)||input.phone.replace(/\D/g,"").length<8)return "Enter a valid mobile number.";
 if(typeof input.notes!=="string"||input.notes.length>2000)return "Keep your notes under 2,000 characters.";
 if(input.consent!==true)return "Accept the required policies before sending.";
 return null;
}
