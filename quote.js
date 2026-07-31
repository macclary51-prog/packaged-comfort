import{initializeApp,getApp,getApps}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import{getAuth,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import{addDoc,collection,getFirestore,serverTimestamp}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const config={apiKey:"AIzaSyDMWaronfPi0cujdvzGIsieadLss_d4iMQ",authDomain:"packaged-comfort-website.firebaseapp.com",projectId:"packaged-comfort-website",storageBucket:"packaged-comfort-website.firebasestorage.app",messagingSenderId:"150317110708",appId:"1:150317110708:web:dab83f056b04b1e0210ee1"};
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app),form=document.getElementById("quoteForm"),button=document.getElementById("quoteSubmitButton"),status=document.getElementById("quoteStatus");
let user=null;
const val=id=>document.getElementById(id)?.value.trim()||"";
const message=(text,error=false)=>{status.textContent=text;status.style.color=error?"#b42318":"#176b46"};

onAuthStateChanged(auth,current=>{
  user=current;
  if(!current)return;
  const name=document.getElementById("fullName"),email=document.getElementById("email");
  if(!name.value&&current.displayName)name.value=current.displayName;
  if(!email.value&&current.email)email.value=current.email;
});

form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!form.checkValidity()){form.reportValidity();return}
  button.disabled=true;button.textContent="Submitting Request...";message("");
  try{
    const ref=await addDoc(collection(db,"quoteRequests"),{
      fullName:val("fullName"),phone:val("phone"),email:val("email"),serviceDate:val("serviceDate"),pickup:val("pickup"),destination:val("destination"),service:val("service"),amount:val("amount"),details:val("details"),status:"new",createdBy:user?.uid||null,createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    });
    form.reset();
    message(`Your quote request was submitted successfully. Request reference: ${ref.id.slice(0,8).toUpperCase()}`);
  }catch(error){
    console.error(error);
    message("Your request could not be submitted. Call or text 725-724-0012 for assistance.",true);
  }finally{
    button.disabled=false;button.textContent="Submit Quote Request";
  }
});
