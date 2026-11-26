(() => {
  const cfg = window.AETHER_CONFIG || {};
  const configured = cfg.supabaseUrl && !cfg.supabaseUrl.startsWith("YOUR_") &&
    cfg.supabaseAnonKey && !cfg.supabaseAnonKey.startsWith("YOUR_");
  const client = configured && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  let units = [];
  let session = null;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const demo = [
    {id:"demo-1",name:"Example Unit Alpha",value:1200,demand:"High",rarity:"Mythic",trend:"Rising",tier:"S",obtain:"Summon"},
    {id:"demo-2",name:"Example Unit Beta",value:650,demand:"Medium",rarity:"Legendary",trend:"Stable",tier:"A",obtain:"Banner"},
    {id:"demo-3",name:"Example Unit Gamma",value:250,demand:"Low",rarity:"Epic",trend:"Falling",tier:"B",obtain:"Event"}
  ];
  function notify(text){ alert(text); }
  function dateLabel(v){ if(!v)return "—"; const d=new Date(v); return isNaN(d)?"—":d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}); }
  async function loadUnits(){
    if(!client){ units=demo; $("lastUpdated").textContent="DEMO"; render(); return; }
    const {data,error}=await client.from("units").select("*").order("value",{ascending:false});
    if(error){ console.error(error); units=[]; $("unitRows").innerHTML='<tr><td colspan="7" class="empty">Could not load units. Check your Supabase setup.</td></tr>'; return; }
    units=data||[]; render();
  }
  function render(){
    $("unitCount").textContent=units.length;
    $("lastUpdated").textContent=units.length?dateLabel(units.reduce((a,b)=>!a||new Date(b.updated_at||b.created_at)>new Date(a)?(b.updated_at||b.created_at):a,null)):"—";
    const rarities=[...new Set(units.map(u=>u.rarity).filter(Boolean))].sort();
    const filter=$("rarityFilter"), old=filter.value;
    filter.innerHTML='<option value="">All rarities</option>'+rarities.map(r=>`<option>${esc(r)}</option>`).join('');
    filter.value=rarities.includes(old)?old:"";
    const q=$("search").value.toLowerCase(), rarity=filter.value, tier=$("tierFilter").value;
    let list=units.filter(u=>(u.name||"").toLowerCase().includes(q)&&(!rarity||u.rarity===rarity)&&(!tier||u.tier===tier));
    const sort=$("sortBy").value;
    list.sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="value-asc"?Number(a.value)-Number(b.value):Number(b.value)-Number(a.value));
    $("resultCount").textContent=`${list.length} units`;
    $("unitRows").innerHTML=list.length?list.map(u=>`<tr>
      <td><span class="unit-name">${esc(u.name)}</span></td><td class="value">${Number(u.value||0).toLocaleString()}</td>
      <td><span class="pill">${esc(u.demand)}</span></td><td>${esc(u.rarity)}</td>
      <td class="${u.trend==="Rising"?"trend-up":u.trend==="Falling"?"trend-down":"trend-stable"}">${u.trend==="Rising"?"↑":u.trend==="Falling"?"↓":"→"} ${esc(u.trend)}</td>
      <td><span class="pill tier">${esc(u.tier)}</span></td><td>${esc(u.obtain)}</td></tr>`).join(''):'<tr><td colspan="7" class="empty">No units found. Add units from the admin panel.</td></tr>';
    renderTrade(); renderAdminList();
  }
  ["search","rarityFilter","tierFilter","sortBy"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",render));
  function addTradeRow(side){
    const wrap=$(side==="give"?"giveItems":"getItems"), row=document.createElement("div"); row.className="trade-row";
    const opts=units.map(u=>`<option value="${esc(u.id)}">${esc(u.name)} · ${Number(u.value||0).toLocaleString()}</option>`).join("");
    row.innerHTML=`<select aria-label="Choose unit"><option value="">Choose a unit</option>${opts}</select><input type="number" min="1" step="1" value="1" aria-label="Quantity"><button type="button" aria-label="Remove">×</button>`;
    row.querySelector("select").addEventListener("change",renderTrade); row.querySelector("input").addEventListener("input",renderTrade);
    row.querySelector("button").addEventListener("click",()=>{row.remove();renderTrade()}); wrap.append(row); renderTrade();
  }
  document.querySelectorAll(".add-item").forEach(b=>b.addEventListener("click",()=>addTradeRow(b.dataset.side)));
  function sideTotal(id){
    let total=0; $(id).querySelectorAll(".trade-row").forEach(row=>{const unit=units.find(u=>u.id===row.querySelector("select").value); const qty=Math.max(0,Number(row.querySelector("input").value)||0); if(unit)total+=Number(unit.value||0)*qty;}); return total;
  }
  function renderTrade(){
    const give=sideTotal("giveItems"),get=sideTotal("getItems"); $("giveTotal").textContent=give.toLocaleString(); $("getTotal").textContent=get.toLocaleString();
    const el=$("tradeResult"); if(!give&&!get){el.textContent="Add units to compare the trade.";return;}
    const diff=get-give, pct=give?Math.abs(diff)/give*100:0;
    el.textContent=diff===0?"Values are equal.":diff>0?`You receive ${diff.toLocaleString()} more value (${pct.toFixed(1)}% gain).`:`You give ${(-diff).toLocaleString()} more value (${pct.toFixed(1)}% overpay).`;
  }
  $("adminOpen").addEventListener("click",()=>{$("adminDialog").showModal();syncAdmin()});
  async function syncAdmin(){
    if(!client){$("loginPanel").hidden=false;$("adminPanel").hidden=true;$("loginMessage").textContent="Connect Supabase first (see README). Demo mode is read-only.";return;}
    const {data}=await client.auth.getSession(); session=data.session;
    $("loginPanel").hidden=!!session; $("adminPanel").hidden=!session;
    if(session){$("adminIdentity").textContent=session.user.email; renderAdminList();}
  }
  $("loginButton").addEventListener("click",async()=>{
    $("loginMessage").textContent="Signing in…";
    const {error}=await client.auth.signInWithPassword({email:$("adminEmail").value,password:$("adminPassword").value});
    $("loginMessage").textContent=error?error.message:"Signed in."; if(!error)await syncAdmin();
  });
  $("logoutButton").addEventListener("click",async()=>{await client.auth.signOut();await syncAdmin()});
  $("resetForm").addEventListener("click",resetForm);
  function resetForm(){ $("unitForm").reset(); $("unitId").value=""; $("editorTitle").textContent="Add a unit"; }
  $("unitForm").addEventListener("submit",async e=>{
    e.preventDefault(); if(!client||!session)return;
    const id=$("unitId").value, payload={name:$("unitName").value.trim(),value:Number($("unitValue").value),demand:$("unitDemand").value,rarity:$("unitRarity").value.trim(),trend:$("unitTrend").value,tier:$("unitTier").value,obtain:$("unitObtain").value.trim()};
    const result=id?await client.from("units").update(payload).eq("id",id):await client.from("units").insert(payload);
    if(result.error){notify(result.error.message);return;} resetForm(); await loadUnits(); renderAdminList();
  });
  function renderAdminList(){
    if(!$("adminUnitList"))return;
    if(!session){$("adminUnitList").innerHTML="";return;}
    $("adminUnitList").innerHTML=units.map(u=>`<div class="admin-unit"><span>${esc(u.name)} · ${Number(u.value).toLocaleString()}</span><span><button data-edit="${esc(u.id)}">Edit</button><button class="delete" data-delete="${esc(u.id)}">Delete</button></span></div>`).join("")||'<p class="muted">No units yet.</p>';
    $("adminUnitList").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{const u=units.find(x=>x.id===b.dataset.edit); if(!u)return; $("unitId").value=u.id;$("unitName").value=u.name;$("unitValue").value=u.value;$("unitDemand").value=u.demand;$("unitRarity").value=u.rarity;$("unitTrend").value=u.trend;$("unitTier").value=u.tier;$("unitObtain").value=u.obtain;$("editorTitle").textContent="Edit unit";$("unitForm").scrollIntoView({behavior:"smooth"});}));
    $("adminUnitList").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Delete this unit?"))return;const {error}=await client.from("units").delete().eq("id",b.dataset.delete);if(error)notify(error.message);else await loadUnits();}));
  }
  if(client)client.auth.onAuthStateChange(()=>syncAdmin());
  loadUnits();
})();