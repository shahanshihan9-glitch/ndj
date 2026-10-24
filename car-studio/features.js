const productMeta = [
  { category: 'players', brand: 'YD', amount: 19000, ram: '2GB', storage: '32GB', warranty: '3 months' },
  { category: 'players', brand: 'Kenwood', amount: 23000, ram: '2GB', storage: '32GB', warranty: '3 months' },
  { category: 'players', brand: 'Lenovo', amount: 34000, ram: '2GB', storage: '32GB', warranty: 'Ask the team' },
  { category: 'players', brand: 'Lenovo', amount: null, ram: '4GB', storage: '64GB', warranty: '1 year' },
  { category: 'cameras', brand: 'Blaupunkt', amount: 25000, warranty: 'Ask the team' },
  { category: 'cameras', brand: 'Blaupunkt', amount: 25000, warranty: 'Ask the team' },
  { category: 'cameras', brand: 'Blaupunkt', amount: 25000, warranty: 'Ask the team' },
  { category: 'horns', brand: 'Other', amount: null, warranty: 'Ask the team' }
];
const savedProducts = new Set();
const comparedProducts = new Set();
const quoteItems = new Map();
let currentCategory = 'all';
let currentGallery = 'all';
let orderMode = 'quote';
let toastTimer;
const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rupees = amount => 'Rs. ' + amount.toLocaleString('en-LK');
function notify(message) {
  const el = document.getElementById('toast');
  el.textContent = message; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 2800);
}
function productCard(index) {
  const p = P[index], saved = savedProducts.has(index), compared = comparedProducts.has(index);
  return `<article class="card">
    <div class="product-image-wrap"><img src="img/${p.img}.jpg" alt="${escapeHTML(p.n)}" loading="lazy">
      ${p.lbl ? `<span class="product-marker">${escapeHTML(p.lbl)}</span>` : ''}
      <button class="save-button" onclick="toggleSaved(${index})" aria-label="${saved?'Unsave':'Save'} ${escapeHTML(p.n)}" aria-pressed="${saved}">${saved?'♥':'♡'}</button>
    </div>
    <div class="cb"><span class="no">Product No. ${index+1} / ${escapeHTML(productMeta[index].brand)}</span>
      <button class="product-title" onclick="viewProduct(${index})">${escapeHTML(p.n)}</button>
      <div class="price">${escapeHTML(p.price)}</div>
      <ul class="f">${p.f.slice(0,4).map(f=>`<li>${escapeHTML(f)}</li>`).join('')}</ul>
      <p class="tag">${escapeHTML(p.t)}</p>
      <div class="product-actions"><button onclick="viewProduct(${index})">View all specs</button><button class="${compared?'selected':''}" onclick="toggleCompare(${index})" aria-pressed="${compared}">${compared?'Selected':'Compare'}</button></div>
      <button class="add-quote" onclick="addQuote(${index})">${orderMode==='delivery'?'Add to Order':'Add to Quote'}</button>
    </div></article>`;
}
function renderProducts() {
  const query = document.getElementById('product-search').value.toLowerCase().trim();
  const brand = document.getElementById('brand-filter').value;
  const budget = document.getElementById('budget-filter').value;
  const sort = document.getElementById('sort-products').value;
  let indices = P.map((_,i)=>i).filter(i=>{
    const meta = productMeta[i], p = P[i];
    const categoryMatches = currentCategory === 'all' || (currentCategory === 'saved' ? savedProducts.has(i) : meta.category === currentCategory);
    const budgetMatches = !budget || (budget === 'unknown' ? meta.amount === null : meta.amount !== null && meta.amount <= Number(budget));
    return categoryMatches && (!brand || meta.brand === brand) && budgetMatches &&
      (!query || [p.n,p.price,p.sub||'',...p.f,p.t].join(' ').toLowerCase().includes(query));
  });
  indices.sort((a,b)=>{
    if (sort === 'name') return P[a].n.localeCompare(P[b].n);
    if (sort === 'featured') return a-b;
    if (productMeta[a].amount === null) return productMeta[b].amount === null ? a-b : 1;
    if (productMeta[b].amount === null) return -1;
    return sort === 'low' ? productMeta[a].amount-productMeta[b].amount : productMeta[b].amount-productMeta[a].amount;
  });
  document.getElementById('grid').innerHTML = indices.map(productCard).join('');
  document.getElementById('result-count').textContent = `${indices.length} product${indices.length===1?'':'s'}`;
  document.getElementById('no-products').hidden = indices.length > 0;
  document.getElementById('saved-count').textContent = savedProducts.size;
  document.getElementById('compare-count').textContent = `${comparedProducts.size} / 3`;
}
function resetFilters() {
  currentCategory = 'all';
  ['product-search','brand-filter','budget-filter'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('sort-products').value='featured';
  document.querySelectorAll('#category-filters button').forEach(b=>{
    const active = b.dataset.category === 'all'; b.classList.toggle('active',active); b.setAttribute('aria-pressed',active);
  });
  renderProducts();
}
function toggleSaved(index) {
  if (savedProducts.has(index)) savedProducts.delete(index); else savedProducts.add(index);
  renderProducts();
  notify(savedProducts.has(index) ? 'Saved for this visit' : 'Removed from saved products');
}
function toggleCompare(index) {
  if (comparedProducts.has(index)) comparedProducts.delete(index);
  else if (comparedProducts.size < 3) comparedProducts.add(index);
  else { notify('Compare up to 3 products. Deselect one first.'); return; }
  renderProducts();
}
function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog.open) dialog.showModal();
}
function closeDialog(id) { document.getElementById(id).close(); }
function viewProduct(index) {
  const p=P[index], meta=productMeta[index];
  document.getElementById('product-detail').innerHTML=`<div class="product-detail-layout">
    <div><img src="img/${p.img}.jpg" alt="${escapeHTML(p.n)}"><p class="form-note">AI-generated product illustration. Confirm actual appearance with the team.</p></div>
    <div><span class="eyebrow">${escapeHTML(meta.brand)} / Product ${index+1}</span><h2>${escapeHTML(p.n)}</h2><div class="price">${escapeHTML(p.price)}</div>
    <ul class="detail-features">${p.f.map(f=>`<li>${escapeHTML(f)}</li>`).join('')}</ul>
    <p class="tag">Warranty: ${escapeHTML(meta.warranty)}. ${escapeHTML(p.t)}.</p>
    <p class="form-note">Confirm stock, compatibility, fitting accessories and the final installed price before ordering.</p>
    <div class="detail-actions"><button class="btn p" onclick="addQuote(${index});closeDialog('product-dialog')">${orderMode==='delivery'?'Add to Order':'Add to Quote'}</button><button class="btn" onclick="closeDialog('product-dialog');chooseService('${meta.category==='players'?'Android player installation':meta.category==='cameras'?'Dash camera installation':'Horn installation'}')">Check Vehicle Fit</button></div></div></div>`;
  openDialog('product-dialog');
}
function openComparison() {
  const indices=[...comparedProducts];
  if (indices.length < 2) { notify('Select at least 2 products to compare'); return; }
  const rows=[
    ['Listed price',i=>P[i].price],['Category',i=>({players:'Android player',cameras:'Dash camera',horns:'Horn'}[productMeta[i].category])],
    ['RAM / storage',i=>productMeta[i].ram?`${productMeta[i].ram} / ${productMeta[i].storage}`:'Not applicable'],
    ['Warranty',i=>productMeta[i].warranty],['Installation / delivery',i=>P[i].t]
  ];
  document.getElementById('comparison-content').innerHTML=`<span class="eyebrow">Find your fit</span><h2>Compare Your Choices</h2><p class="muted">Listed specifications only. Ask the team to confirm any missing details.</p>
    <div class="table-scroll"><table class="comparison-table"><thead><tr><th scope="col">Details</th>${indices.map(i=>`<th scope="col"><img src="img/${P[i].img}.jpg" alt="">${escapeHTML(P[i].n)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(([title,get])=>`<tr><th scope="row">${title}</th>${indices.map(i=>`<td>${escapeHTML(get(i))}</td>`).join('')}</tr>`).join('')}
    <tr><th scope="row">All features</th>${indices.map(i=>`<td><ul>${P[i].f.map(f=>`<li>${escapeHTML(f)}</li>`).join('')}</ul></td>`).join('')}</tr>
    <tr><th scope="row">Next step</th>${indices.map(i=>`<td><button class="btn p" onclick="addQuote(${i});this.textContent='Added to Basket'">${orderMode==='delivery'?'Add to Order':'Add to Quote'}</button></td>`).join('')}</tr></tbody></table></div>`;
  openDialog('compare-dialog');
}
function addQuote(index) {
  quoteItems.set(index,Math.min(99,(quoteItems.get(index)||0)+1));
  updateQuoteCount(); notify(orderMode==='delivery'?'Added to your delivery order':'Added to your quote basket');
  if (document.getElementById('quote-dialog').open) renderQuote();
}
function updateQuoteCount() {
  document.getElementById('quote-count').textContent=[...quoteItems.values()].reduce((sum,n)=>sum+n,0);
}
function adjustQuote(index,delta) {
  const next=(quoteItems.get(index)||0)+delta;
  if(next<=0)quoteItems.delete(index);else quoteItems.set(index,Math.min(99,next));
  updateQuoteCount(); renderQuote();
}
function removeQuote(index) { quoteItems.delete(index); updateQuoteCount(); renderQuote(); }
function setQuoteQuantity(index,input) {
  const raw=Number(input.value);
  if(!Number.isInteger(raw)||raw<1||raw>99) {
    input.value=quoteItems.get(index)||1;
    notify('Enter a whole-number quantity from 1 to 99');
    return;
  }
  quoteItems.set(index,raw);
  updateQuoteCount(); renderQuote();
}
function setOrderMode(mode) {
  orderMode=mode==='delivery'?'delivery':'quote';
  document.querySelectorAll('[data-order-mode]').forEach(button=>{
    const active=button.dataset.orderMode===orderMode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',active);
  });
  document.getElementById('basket-label').textContent=orderMode==='delivery'?'Order':'Quote';
  document.getElementById('basket-trigger').setAttribute('aria-label',orderMode==='delivery'?'Open delivery order basket':'Open quote basket');
  renderProducts();
  renderQuote();
}
function quoteMessage() {
  const lines=[...quoteItems].map(([i,qty])=>`${qty} x ${P[i].n} (${productMeta[i].amount===null?'price requested':P[i].price+' each'})`);
  const subtotal=[...quoteItems].reduce((sum,[i,qty])=>sum+(productMeta[i].amount||0)*qty,0);
  return `Hi Car Studio, please quote for:\n${lines.join('\n')}\n\nKnown-price product subtotal: ${rupees(subtotal)}.\nPlease confirm stock, any enquiry-only prices, installation, delivery charges and the final total. This is an enquiry, not a confirmed order.`;
}
function renderQuote() {
  const target=document.getElementById('quote-content');
  const delivery=orderMode==='delivery';
  document.getElementById('basket-title').textContent=delivery?'Your Delivery Order':'Your Quote Basket';
  document.getElementById('basket-intro').textContent=delivery?'Order multiple products in one request. Final confirmation is by WhatsApp.':'An enquiry list, not a paid or confirmed order.';
  document.getElementById('quote-dialog').setAttribute('aria-label',delivery?'Delivery order basket':'Quote basket');
  document.getElementById('delivery-form').hidden=!delivery||!quoteItems.size;
  if (!quoteItems.size) {
    target.innerHTML=`<div class="empty-state"><h3>Your basket is empty</h3><p>Choose products and click ${delivery?'Add to Order':'Add to Quote'}.</p><button class="btn p" onclick="closeDialog('quote-dialog');go('products')">Explore Products</button></div>`;
    return;
  }
  const subtotal=[...quoteItems].reduce((sum,[i,qty])=>sum+(productMeta[i].amount||0)*qty,0);
  const unknown=[...quoteItems.keys()].some(i=>productMeta[i].amount===null);
  target.innerHTML=[...quoteItems].map(([i,qty])=>`<div class="quote-line"><img src="img/${P[i].img}.jpg" alt=""><div><strong>${escapeHTML(P[i].n)}</strong><small>${escapeHTML(P[i].price)}${productMeta[i].amount===null?'':' each'}</small>
    <div class="quantity-controls"><button onclick="adjustQuote(${i},-1)" aria-label="Decrease ${escapeHTML(P[i].n)} quantity">−</button><input class="quantity-input" type="number" value="${qty}" min="1" max="99" step="1" onchange="setQuoteQuantity(${i},this)" aria-label="${escapeHTML(P[i].n)} quantity"><button onclick="adjustQuote(${i},1)" aria-label="Increase ${escapeHTML(P[i].n)} quantity">+</button><button class="remove-item" onclick="removeQuote(${i})">Remove</button></div></div>
    <div>${productMeta[i].amount===null?'To be quoted':rupees(productMeta[i].amount*qty)}</div></div>`).join('')+
    `<div class="quote-total"><span>Known-price subtotal</span><b>${rupees(subtotal)}</b></div>
    <p class="form-note">${unknown?'Some items have no listed price and are excluded from this subtotal. ':''}Installation, fitting accessories and delivery charges are not included. The team must confirm the final total.</p>`+
    (delivery?`<p class="delivery-basket-note">Next: add your delivery details below and review the complete order request.</p>`:
    `<textarea class="message-preview" readonly rows="8" aria-label="Quote message preview">${escapeHTML(quoteMessage())}</textarea>
    <a class="btn w" target="_blank" rel="noopener" href="${W+encodeURIComponent(quoteMessage())}">Continue to WhatsApp</a>
    <p class="form-note">Review and send in WhatsApp. Nothing is sent automatically, and no payment is taken here.</p>`);
}
function openQuote() { renderQuote(); openDialog('quote-dialog'); }
document.querySelectorAll('[data-order-mode]').forEach(button=>button.addEventListener('click',()=>setOrderMode(button.dataset.orderMode)));
document.getElementById('delivery-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!quoteItems.size){notify('Add products before preparing a delivery order');return;}
  for(const field of event.currentTarget.querySelectorAll('input[required]:not([type="checkbox"])')){
    field.setCustomValidity(field.value.trim()?'':'Please enter this detail.');
  }
  const contact=event.currentTarget.elements.contact;
  if(contact.value.replace(/\D/g,'').length<7)contact.setCustomValidity('Enter a phone number with at least 7 digits.');
  if(!event.currentTarget.reportValidity())return;
  const details=new FormData(event.currentTarget);
  const lines=[...quoteItems].map(([i,qty])=>`${qty} x ${P[i].n} | ${productMeta[i].amount===null?'Price to be confirmed':P[i].price+' each; line total '+rupees(productMeta[i].amount*qty)}`);
  const subtotal=[...quoteItems].reduce((sum,[i,qty])=>sum+(productMeta[i].amount||0)*qty,0);
  const unknown=[...quoteItems.keys()].some(i=>productMeta[i].amount===null);
  const address=[details.get('street'),details.get('address2'),details.get('city'),details.get('district'),details.get('postcode')].filter(Boolean).map(value=>value.trim()).join(', ');
  const message=`Hi Car Studio, I would like to place a DELIVERY ORDER REQUEST.\n\nITEMS\n${lines.join('\n')}\n\nKnown-price product subtotal: ${rupees(subtotal)}${unknown?'\nEnquiry-only items are not included in this subtotal.':''}\nDelivery charges: please confirm.\nFinal total: awaiting confirmation.\n\nDELIVERY DETAILS\nRecipient: ${details.get('recipient').trim()}\nPhone / WhatsApp: ${details.get('contact').trim()}\nAddress: ${address}\nPayment preference: ${details.get('payment')}\nNotes: ${details.get('instructions').trim()||'None'}\n\nPlease confirm availability, prices, payment, delivery charges and dispatch timing before accepting or dispatching this order. I understand no order is confirmed and no payment is taken through the website.`;
  document.getElementById('delivery-preview').value=message;
  document.getElementById('send-delivery').href=W+encodeURIComponent(message);
  closeDialog('quote-dialog');
  openDialog('delivery-review-dialog');
});
function editDeliveryOrder() {
  closeDialog('delivery-review-dialog');
  openQuote();
}
document.getElementById('delivery-form').addEventListener('input',event=>{
  if(event.target.setCustomValidity)event.target.setCustomValidity('');
});

const services=[
  ['Android player installation','hero','A smarter dashboard','Explore Android players and ask about dashboard frames, steering controls and wiring compatibility.'],
  ['Dash camera installation','p6','Record your journeys','Compare front, dual-lens and 3-channel cameras, then ask about mounting and installation for your vehicle.'],
  ['Interior protection film','film-hero','Care for your interior','Ask about plastic-trim protection film, suitable surfaces and application pricing.'],
  ['Speaker upgrade','speakers-hero','Upgrade your speakers','Discuss available JBL, Infinity, Pioneer and Kenwood models and suitable speaker sizes.'],
  ['Subwoofer upgrade','subwoofer-hero','Plan your sound system','Tell us your listening preferences and available space. Request a compatible subwoofer setup quote.'],
  ['Window / windscreen tinting','tint-hero','Tinting enquiries','Discuss window or windscreen tinting options, vehicle coverage and an application quote.']
];
document.getElementById('service-grid').innerHTML=services.map(([name,img,title,desc])=>`<article class="service-card"><img src="img/${img}.jpg" alt="${escapeHTML(name)} concept illustration" loading="lazy"><div class="service-body"><span class="eyebrow">${escapeHTML(name)}</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(desc)}</p><button class="btn p" onclick="chooseService('${name}')">Request a Quote</button></div></article>`).join('');
function chooseService(name) {
  go('book');
  document.getElementById('request-service').value=name;
  document.getElementById('request-service').focus({preventScroll:true});
}
const galleryItems=[
  {title:'Connected dashboard',img:'hero',category:'dashboard',service:'Android player installation'},
  {title:'Big-screen Android player',img:'p3',category:'dashboard',service:'Android player installation'},
  {title:'Speaker upgrade concept',img:'speakers-hero',category:'audio',service:'Speaker upgrade'},
  {title:'Subwoofer setup concept',img:'subwoofer-hero',category:'audio',service:'Subwoofer upgrade'},
  {title:'Interior film concept',img:'film-hero',category:'protection',service:'Interior protection film'},
  {title:'Three-channel dash camera',img:'p6',category:'cameras',service:'Dash camera installation'},
  {title:'Window tinting concept',img:'tint-hero',category:'protection',service:'Window / windscreen tinting'}
];
function renderGallery() {
  document.getElementById('gallery-grid').innerHTML=galleryItems.filter(g=>currentGallery==='all'||g.category===currentGallery).map(g=>`<button class="gallery-card" onclick="chooseService('${g.service}')" aria-label="Request ${g.service} inspired by ${g.title}"><img src="img/${g.img}.jpg" alt="${g.title}, AI-generated illustration" loading="lazy"><div class="gallery-caption"><b>${g.title}</b><small>AI concept illustration / Request this upgrade</small></div></button>`).join('');
}
document.querySelectorAll('#gallery-filters button').forEach(button=>button.addEventListener('click',()=>{
  currentGallery=button.dataset.gallery;
  document.querySelectorAll('#gallery-filters button').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  renderGallery();
}));
document.getElementById('request-form').addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  const data=new FormData(form);
  const date=data.get('date');
  const message=`Hi Car Studio, I would like a quote / installation request.\n\nName: ${data.get('customer').trim()}\nPhone / WhatsApp: ${data.get('phone').trim()}\nVehicle: ${data.get('make').trim()} ${data.get('model').trim()}${data.get('year')?' ('+data.get('year')+')':''}\nUpgrade: ${data.get('service')}\nPreferred date: ${date||'Please advise availability'}\nBudget: ${data.get('budget')||'Please advise'}\nNotes: ${data.get('notes').trim()||'None'}\n\nPlease confirm compatibility, pricing and an available appointment. I understand this request is not a confirmed booking.`;
  document.getElementById('request-preview').value=message;
  document.getElementById('send-request').href=W+encodeURIComponent(message);
  openDialog('request-dialog');
});
const dateInput=document.getElementById('request-date');
const today=new Date();
document.querySelector('[name="year"]').max=today.getFullYear()+1;
dateInput.min=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');

document.getElementById('product-search').addEventListener('input',renderProducts);
['brand-filter','budget-filter','sort-products'].forEach(id=>document.getElementById(id).addEventListener('change',renderProducts));
document.getElementById('reset-filters').addEventListener('click',resetFilters);
document.querySelectorAll('#category-filters button').forEach(button=>button.addEventListener('click',()=>{
  currentCategory=button.dataset.category;
  document.querySelectorAll('#category-filters button').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  renderProducts();
}));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
}));
// Preserve the established Car Studio dark appearance; light mode is optional.
let currentTheme='dark';
function applyTheme(){
  document.documentElement.dataset.theme=currentTheme;
  document.querySelector('.logo img').src=currentTheme==='dark'?'img/car-studio-logo-dark.png':'img/car-studio-logo-light.png';
  const toggle=document.getElementById('theme-toggle');
  toggle.textContent=currentTheme==='dark'?'Light':'Dark';
  toggle.setAttribute('aria-label',`Switch to ${currentTheme==='dark'?'light':'dark'} theme`);
}
document.getElementById('theme-toggle').addEventListener('click',()=>{currentTheme=currentTheme==='dark'?'light':'dark';applyTheme();});
applyTheme();
renderProducts();
renderGallery();

/* ---- Vehicle picker: suggestions for make/model, remembered for next visit ---- */
const VEHICLES={
  Toyota:['Aqua','Prius','Axio','Allion','Premio','Vitz','Corolla','CHR','Hilux','Land Cruiser Prado','Rush','Passo'],
  Honda:['Vezel','Fit','Grace','Civic','CR-V','Insight','Freed','Airwave'],
  Suzuki:['Wagon R','Alto','Swift','Spacia','Every','Hustler','Jimny','Celerio'],
  Nissan:['Leaf','March','Sunny','X-Trail','Juke','Note','Sylphy','Dayz'],
  Mitsubishi:['Montero','Outlander','Lancer','Pajero','Mirage','L200'],
  Mazda:['Axela','Demio','CX-5','Premacy','Carol'],
  Micro:['Panda','Trend','Tiivolo','Emgrand'],
  Daihatsu:['Mira','Move','Hijet','Tanto'],
  Kia:['Picanto','Sportage','Sorento'],
  Hyundai:['Eon','Tucson','Santa Fe','Elantra'],
  Perodua:['Axia','Bezza','Myvi'],
  Tata:['Nano','Indica','Nexon'],
  Subaru:['Impreza','Forester','XV']
};
document.getElementById('make-list').innerHTML=Object.keys(VEHICLES).map(m=>`<option value="${m}">`).join('');
const makeInput=document.querySelector('#request-form [name="make"]');
const modelInput=document.querySelector('#request-form [name="model"]');
function refreshModels(){
  const key=Object.keys(VEHICLES).find(m=>m.toLowerCase()===makeInput.value.trim().toLowerCase());
  document.getElementById('model-list').innerHTML=(key?VEHICLES[key]:[]).map(m=>`<option value="${m}">`).join('');
}
makeInput.addEventListener('input',refreshModels);
const yearInput=document.querySelector('#request-form [name="year"]');
let savedVehicle=null;
try{savedVehicle=JSON.parse(localStorage.getItem('cs-vehicle')||'null');}catch(e){}
if(savedVehicle&&savedVehicle.make){
  makeInput.value=savedVehicle.make;modelInput.value=savedVehicle.model||'';yearInput.value=savedVehicle.year||'';refreshModels();
}
document.getElementById('request-form').addEventListener('submit',()=>{
  const v={make:makeInput.value.trim(),model:modelInput.value.trim(),year:yearInput.value};
  savedVehicle=v;
  try{localStorage.setItem('cs-vehicle',JSON.stringify(v));}catch(e){}
});
const baseQuoteMessage=quoteMessage;
quoteMessage=function(){
  const msg=baseQuoteMessage();
  if(!savedVehicle||!savedVehicle.make)return msg;
  const veh=[savedVehicle.make,savedVehicle.model,savedVehicle.year].filter(Boolean).join(' ');
  return msg.replace('please quote for:',`please quote for my ${veh}:`);
};

/* ---- Open-now badge: hours come from the JSON-LD block in index.html (Sri Lanka time) ---- */
(function(){
  const spec=JSON.parse(document.getElementById('ld-business').textContent).openingHoursSpecification;
  const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
  const fmt=t=>{let [h,m]=t.split(':').map(Number);const ap=h>=12?'pm':'am';h=h%12||12;return h+(m?':'+String(m).padStart(2,'0'):'')+ap;};
  function status(){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Colombo',weekday:'long',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date());
    const get=t=>parts.find(p=>p.type===t).value;
    const day=get('weekday'),now=Number(get('hour'))*60+Number(get('minute'));
    const today=spec.find(s=>s.dayOfWeek.includes(day));
    if(today&&now>=mins(today.opens)&&now<mins(today.closes))return{open:true,text:'Open now · closes '+fmt(today.closes)};
    if(today&&now<mins(today.opens))return{open:false,text:'Closed · opens today '+fmt(today.opens)};
    for(let i=1;i<=7;i++){
      const name=days[(days.indexOf(day)+i)%7],s=spec.find(x=>x.dayOfWeek.includes(name));
      if(s)return{open:false,text:'Closed · opens '+(i===1?'tomorrow':name)+' '+fmt(s.opens)};
    }
    return{open:false,text:'Closed'};
  }
  function paint(){
    const s=status();
    document.querySelectorAll('[data-open-status]').forEach(el=>{el.textContent=s.text;el.classList.toggle('is-open',s.open);});
  }
  paint();setInterval(paint,60000);
})();
