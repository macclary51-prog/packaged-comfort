import{auth}from"./firebase-config.js";
import{createUserWithEmailAndPassword,onAuthStateChanged,signInWithEmailAndPassword,updateProfile}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import{doc,getDoc,getFirestore,serverTimestamp,setDoc}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db=getFirestore(auth.app),signupForm=document.getElementById("signupForm"),loginForm=document.getElementById("loginForm"),authMessage=document.getElementById("authMessage");
let submitting=false,redirecting=false;

function message(text,error=false){if(!authMessage)return;authMessage.textContent=text;authMessage.style.color=error?"#b42318":"#176b46"}
function friendly(error){
  switch(error.code){
    case"auth/email-already-in-use":return"An account already exists with this email.";
    case"auth/invalid-email":return"Enter a valid email address.";
    case"auth/weak-password":return"Your password must contain at least 6 characters.";
    case"auth/invalid-credential":
    case"auth/invalid-login-credentials":
    case"auth/user-not-found":
    case"auth/wrong-password":return"The email address or password is incorrect.";
    case"auth/user-disabled":return"This account has been disabled.";
    case"auth/too-many-requests":return"Too many attempts were made. Wait and try again.";
    case"auth/network-request-failed":return"Check your internet connection and try again.";
    default:console.error(error);return"Something went wrong. Please try again.";
  }
}

async function isAdmin(user){
  const snap=await getDoc(doc(db,"roles",user.uid));
  if(!snap.exists())return false;
  const role=snap.data();
  return String(role.role||"").trim().toLowerCase()==="admin"&&role.active===true;
}

async function saveCustomer(user){
  const ref=doc(db,"customers",user.uid),snap=await getDoc(ref);
  const data={name:user.displayName?.trim()||user.email?.split("@")[0]||"Customer",email:user.email||"",lastLoginAt:serverTimestamp()};
  if(!snap.exists())data.createdAt=serverTimestamp();
  await setDoc(ref,data,{merge:true});
}

async function route(user){
  if(!user||redirecting)return;
  redirecting=true;
  try{
    if(await isAdmin(user)){location.replace("admin.html");return}
    await saveCustomer(user);
    location.replace("dashboard.html");
  }catch(error){console.error(error);location.replace("dashboard.html")}
}

if(signupForm){
  signupForm.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!signupForm.checkValidity()){signupForm.reportValidity();return}
    const name=document.getElementById("signupName").value.trim(),email=document.getElementById("signupEmail").value.trim(),password=document.getElementById("signupPassword").value,button=document.getElementById("signupButton");
    submitting=true;button.disabled=true;button.textContent="Creating Account...";message("");
    try{
      const result=await createUserWithEmailAndPassword(auth,email,password);
      await updateProfile(result.user,{displayName:name});
      await saveCustomer(result.user);
      message("Account created successfully.");
      setTimeout(()=>location.replace("dashboard.html"),600);
    }catch(error){submitting=false;message(friendly(error),true);button.disabled=false;button.textContent="Create Account"}
  });
}

if(loginForm){
  loginForm.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!loginForm.checkValidity()){loginForm.reportValidity();return}
    const email=document.getElementById("loginEmail").value.trim(),password=document.getElementById("loginPassword").value,button=document.getElementById("loginButton");
    submitting=true;button.disabled=true;button.textContent="Checking Account...";message("");
    try{
      const result=await signInWithEmailAndPassword(auth,email,password);
      const admin=await isAdmin(result.user);
      if(!admin)await saveCustomer(result.user);
      message(admin?"Administrator access confirmed.":"Login successful.");
      setTimeout(()=>location.replace(admin?"admin.html":"dashboard.html"),500);
    }catch(error){submitting=false;message(friendly(error),true);button.disabled=false;button.textContent="Log In"}
  });

  onAuthStateChanged(auth,async user=>{if(user&&!submitting)await route(user)});
}
