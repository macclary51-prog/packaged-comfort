import{initializeApp,getApp,getApps}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import{getAuth,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import{collection,deleteDoc,doc,getDoc,getFirestore,onSnapshot,orderBy,query,serverTimestamp,updateDoc}from"https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const config={apiKey:"AIzaSyDMWaronfPi0cujdvzGIsieadLss_d4iMQ",authDomain:"packaged-comfort-website.firebaseapp.com",projectId:"packaged-comfort-website",storageBucket:"packaged-comfort-website.firebasestorage.app",messagingSenderId:"150317110708",appId:"1:150317110708:web:dab83f056b04b1e0210ee1"};
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app);

const $=id=>document.getElementById(id);
const loading=$("adminLoading"),adminApp=$("adminApp"),toast=$("adminToast");
let requests=[],customers=[],toastTimer;

const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const status=v=>["new","contacted","scheduled","completed","canceled"].includes(v)?v:"new";
const stamp=v=>v?.toDate?new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(v.toDate()):"Date unavailable";
const nameOf=u=>u.displayName?.trim()||u.email?.split("@")[0]||"Administrator";
const initial=(n,e)=>String(n||e||"A").trim().charAt(0).toUpperCase();
const notify=m=>{toast.textContent=m;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)};

async function isAdmin(user){
  const snap=await getDoc(doc(db,"roles",user.uid));
  if(!snap.exists())return false;
  const r=snap.data();
  return String(r.role||"").trim().toLowerCase()==="admin"&&r.active===true;
}

function openView(view){
  document.querySelectorAll("[data-section]").forEach(s=>s.classList.toggle("active",s.dataset.section===view));
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>openView(b.dataset.view)));
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openView(b.dataset.open)));

function updateStats(){
  $("totalCount").textContent=requests.length;
  $("newCount").textContent=requests.filter(r=>status(r.status)==="new").length;
  $("completedCount").textContent=requests.filter(r=>status(r.status)==="completed").length;
  $("customerCount").textContent=customers.length;
}

function statusOptions(current){
  return [["new","New"],["contacted","Contacted"],["scheduled","Scheduled"],["completed","Completed"],["canceled","Canceled"]]
    .map(([v,l])=>`<option value="${v}" ${v===status(current)?"selected":""}>${l}</option>`).join("");
}

function row(r){
  const s=status(r.status);
  return `<tr>
    <td><strong>${esc(r.fullName||"Customer")}</strong><a href="tel:${esc(r.phone||"")}">${esc(r.phone||"No phone")}</a><a href="mailto:${esc(r.email||"")}">${esc(r.email||"No email")}</a><span class="sub">Received ${esc(stamp(r.createdAt))}</span></td>
    <td><strong>${esc(r.service||"Not selected")}</strong><span class="sub">${esc(r.amount||"Amount not provided")}</span><span class="sub">${esc(r.details||"No additional details")}</span></td>
    <td><strong>${esc(r.pickup||"Pickup unavailable")}</strong><span class="sub">to ${esc(r.destination||"Destination unavailable")}</span><span class="sub">Preferred date: ${esc(r.serviceDate||"Not provided")}</span></td>
    <td><span class="status ${s}">${esc(s)}</span><select class="select status-select" data-id="${esc(r.id)}" style="margin-top:8px;min-width:130px">${statusOptions(s)}</select></td>
    <td><div class="actions"><a class="small" href="tel:${esc(r.phone||"")}">Call</a><a class="small" href="sms:${esc(r.phone||"")}">Text</a><a class="small" href="mailto:${esc(r.email||"")}">Email</a><button class="small delete" data-delete="${esc(r.id)}">Delete</button></div></td>
  </tr>`;
}

function matchesRequest(r){
  const q=$("requestSearch").value.trim().toLowerCase(),f=$("statusFilter").value;
  const hay=[r.fullName,r.phone,r.email,r.service,r.amount,r.pickup,r.destination,r.details].join(" ").toLowerCase();
  return(!q||hay.includes(q))&&(f==="all"||status(r.status)===f);
}

function renderRequests(){
  const shown=requests.filter(matchesRequest);
  $("requestRows").innerHTML=shown.map(row).join("");
  $("requestEmpty").hidden=shown.length>0;

  document.querySelectorAll(".status-select").forEach(select=>select.addEventListener("change",async()=>{
    select.disabled=true;
    try{
      await updateDoc(doc(db,"quoteRequests",select.dataset.id),{status:select.value,updatedAt:serverTimestamp()});
      notify("Request status updated.");
    }catch(error){
      console.error(error);notify("The request status could not be updated.");select.disabled=false;
    }
  }));

  document.querySelectorAll("[data-delete]").forEach(button=>button.addEventListener("click",async()=>{
    if(!confirm("Delete this quote request permanently?"))return;
    button.disabled=true;
    try{
      await deleteDoc(doc(db,"quoteRequests",button.dataset.delete));
      notify("Quote request deleted.");
    }catch(error){
      console.error(error);notify("The quote request could not be deleted.");button.disabled=false;
    }
  }));
}

function renderRecent(){
  const list=requests.slice(0,4);
  if(!list.length){$("recentRequests").innerHTML='<div class="empty">No quote requests have been received.</div>';return}
  $("recentRequests").innerHTML=`<div class="tablewrap"><table class="table"><thead><tr><th>Customer</th><th>Service</th><th>Status</th><th>Received</th></tr></thead><tbody>${list.map(r=>`<tr><td><strong>${esc(r.fullName||"Customer")}</strong><span class="sub">${esc(r.phone||"No phone")}</span></td><td><strong>${esc(r.service||"Not selected")}</strong><span class="sub">${esc(r.pickup||"Pickup unavailable")} to ${esc(r.destination||"Destination unavailable")}</span></td><td><span class="status ${status(r.status)}">${esc(status(r.status))}</span></td><td>${esc(stamp(r.createdAt))}</td></tr>`).join("")}</tbody></table></div>`;
}

function renderCustomers(){
  const q=$("customerSearch").value.trim().toLowerCase();
  const shown=customers.filter(c=>!q||[c.name,c.email].join(" ").toLowerCase().includes(q));
  $("customerGrid").innerHTML=shown.map(c=>{
    const n=c.name||c.email?.split("@")[0]||"Customer";
    return `<article class="customer"><div class="avatar">${esc(initial(n,c.email))}</div><b>${esc(n)}</b><a href="mailto:${esc(c.email||"")}">${esc(c.email||"No email")}</a><small>Joined: ${esc(stamp(c.createdAt))}</small><small>Last login: ${esc(stamp(c.lastLoginAt))}</small></article>`;
  }).join("");
  $("customerEmpty").hidden=shown.length>0;
}

$("requestSearch").addEventListener("input",renderRequests);
$("statusFilter").addEventListener("change",renderRequests);
$("customerSearch").addEventListener("input",renderCustomers);

function startListeners(){
  onSnapshot(query(collection(db,"quoteRequests"),orderBy("createdAt","desc")),snap=>{
    requests=snap.docs.map(d=>({id:d.id,...d.data()}));updateStats();renderRequests();renderRecent();
  },e=>{console.error(e);notify("Quote requests could not be loaded.")});

  onSnapshot(query(collection(db,"customers"),orderBy("createdAt","desc")),snap=>{
    customers=snap.docs.map(d=>({id:d.id,...d.data()}));updateStats();renderCustomers();
  },e=>{console.error(e);notify("Customer accounts could not be loaded.")});
}

async function logout(){
  try{await signOut(auth);location.replace("index.html")}
  catch(e){console.error(e);notify("The administrator could not be logged out.")}
}
$("adminLogoutButton").addEventListener("click",logout);
$("adminAccountLogoutButton").addEventListener("click",logout);

onAuthStateChanged(auth,async user=>{
  if(!user){location.replace("login.html");return}
  try{
    if(!await isAdmin(user)){location.replace("dashboard.html");return}
    const n=nameOf(user),e=user.email||"Administrator account";
    $("adminTopName").textContent=n;$("adminTopEmail").textContent=e;$("adminSideName").textContent=n;$("adminSideEmail").textContent=e;$("adminAvatar").textContent=initial(n,e);$("adminFirstName").textContent=n.split(/\s+/)[0];
    loading.hidden=true;adminApp.hidden=false;startListeners();
  }catch(error){console.error(error);location.replace("login.html")}
});
