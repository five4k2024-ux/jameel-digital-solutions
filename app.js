const cfg=window.PORTFOLIO_CONFIG;
const db=window.supabase.createClient(cfg.url,cfg.key);
const fallbackProjects=[
 {title:'برنامج تنظيف وصيانة الكمبيوتر',category:'برامج سطح المكتب',short_description:'تنظيف الملفات المؤقتة وصيانة النظام وتحسين الأداء.',tech_tags:['Windows','Desktop','Maintenance']},
 {title:'نظام HR للموارد البشرية',category:'أنظمة أعمال',short_description:'إدارة الموظفين والحضور والرواتب والعقود والتقارير.',tech_tags:['VB.NET','SQL Server','HR']},
 {title:'برنامج التحميل المتكامل',category:'برامج سطح المكتب',short_description:'تحميل الفيديو والملفات مع دعم صيغ وخيارات متعددة.',tech_tags:['Downloader','HTTP','Video']},
 {title:'برنامج تحويل ومعالجة الصور',category:'أدوات',short_description:'تحويل صيغ الصور وتجهيزها للاستخدامات المختلفة.',tech_tags:['Images','Converter','Tools']},
 {title:'موقع مطالبات ودفع الموردين',category:'مواقع وأنظمة',short_description:'بوابة للمطالبات والاعتماد والتحويل وإشعارات واتساب.',tech_tags:['Web','Suppliers','Payments']},
 {title:'صفحات الويب والمواقع والمتاجر',category:'تصميم وتطوير ويب',short_description:'صفحات تعريفية وتسويقية ومتاجر وتجارب متجاوبة.',tech_tags:['HTML','CSS','JavaScript']},
 {title:'برنامج الأرشيف الإلكتروني',category:'أنظمة أعمال',short_description:'أرشفة المستندات والبحث والصلاحيات والنسخ الاحتياطي.',tech_tags:['Archive','Database','Documents']},
 {title:'برنامج ربط السيرفر بعدة أجهزة',category:'شبكات وأنظمة',short_description:'ربط عدة أجهزة بالسيرفر وإدارة الاتصال داخل الشبكة.',tech_tags:['Server','LAN','Networking']}
];
let projects=[];
const partners=['FIVE 4K','Cloud Platform','Business Partner','Tech Studio','Creative Hub','Digital Solutions'];
const grid=document.getElementById('projectsGrid'),filters=document.getElementById('filters');
const modal=document.getElementById('projectModal');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const mediaIcons=['◫','▦','⬇','◇','◉','⌘','▣','⇄'];

function mediaMarkup(p,i){
  const image=p.cover_url?esc(p.cover_url):'';
  const video=p.video_url?esc(p.video_url):'';
  if(video){
    return `<div class="project-media has-video" data-action="video" data-id="${esc(p.id||String(i))}">
      ${image?`<img src="${image}" alt="${esc(p.title)}" loading="lazy">`:`<video src="${video}" preload="metadata" muted playsinline></video>`}
      <span class="media-badge video-badge">فيديو</span>
      <span class="media-duration">▶</span>
      <button class="media-play" type="button" aria-label="تشغيل فيديو ${esc(p.title)}">▶</button>
      <span class="media-expand" aria-hidden="true">⛶</span>
    </div>`;
  }
  if(image){
    return `<div class="project-media has-image" data-action="image" data-id="${esc(p.id||String(i))}">
      <img src="${image}" alt="${esc(p.title)}" loading="lazy">
      <span class="media-badge image-badge">صور</span>
      <span class="media-expand" aria-hidden="true">⛶</span>
    </div>`;
  }
  return `<div class="project-media project-media-empty"><span class="project-icon">${mediaIcons[i%mediaIcons.length]}</span><span class="media-badge">مشروع</span></div>`;
}

function card(p,i){
  const media=mediaMarkup(p,i);
  const mainAction=p.video_url
    ?`<button class="card-action primary" type="button" data-action="video" data-id="${esc(p.id||String(i))}"><span>▶</span> مشاهدة الفيديو</button>`
    :p.cover_url
      ?`<button class="card-action primary" type="button" data-action="image" data-id="${esc(p.id||String(i))}"><span>▧</span> عرض الصورة</button>`
      :`<button class="card-action primary" type="button" data-action="details" data-id="${esc(p.id||String(i))}">التفاصيل</button>`;
  return `<article class="project-card reveal show">
    ${media}
    <div class="project-content">
      <span class="project-category">${esc(p.category)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.short_description)}</p>
      <div class="project-tags">${(p.tech_tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div>
      <div class="project-actions">
        <button class="card-action secondary" type="button" data-action="details" data-id="${esc(p.id||String(i))}">التفاصيل <span>ⓘ</span></button>
        ${mainAction}
      </div>
    </div>
  </article>`;
}

function draw(filter='الكل'){
  grid.innerHTML=projects.filter(p=>filter==='الكل'||p.category===filter).map(card).join('')||'<p>سيتم إضافة المشاريع قريبًا.</p>';
}
function drawFilters(){
  const cats=['الكل',...new Set(projects.map(p=>p.category))];
  filters.innerHTML=cats.map((c,i)=>`<button class="filter-btn ${i===0?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}
async function loadProjects(){
  const {data,error}=await db.from('portfolio_projects').select('*').eq('is_published',true).order('sort_order');
  projects=error?fallbackProjects:(data&&data.length?data:fallbackProjects);
  projects=projects.map((p,i)=>({...p,id:p.id||`fallback-${i}`}));
  drawFilters();draw();
}
function findProject(id){return projects.find(p=>String(p.id)===String(id));}
function openModal(p,mode='details'){
  if(!p)return;
  const media=document.getElementById('projectModalMedia');
  document.getElementById('projectModalCategory').textContent=p.category||'';
  document.getElementById('projectModalTitle').textContent=p.title||'';
  document.getElementById('projectModalDescription').textContent=p.long_description||p.short_description||'';
  document.getElementById('projectModalTags').innerHTML=(p.tech_tags||[]).map(t=>`<span>${esc(t)}</span>`).join('');
  if(mode==='video'&&p.video_url){
    media.innerHTML=`<video controls autoplay playsinline ${p.cover_url?`poster="${esc(p.cover_url)}"`:''}><source src="${esc(p.video_url)}"></video>`;
  }else if((mode==='image'||mode==='details')&&p.cover_url){
    media.innerHTML=`<img src="${esc(p.cover_url)}" alt="${esc(p.title)}">`;
  }else if(p.video_url){
    media.innerHTML=`<video controls playsinline ${p.cover_url?`poster="${esc(p.cover_url)}"`:''}><source src="${esc(p.video_url)}"></video>`;
  }else{
    media.innerHTML=`<div class="modal-placeholder">${esc(p.title)}</div>`;
  }
  modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
}
function closeModal(){
  const v=modal.querySelector('video');if(v){v.pause();v.removeAttribute('src');}
  modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');
}
filters.addEventListener('click',e=>{if(!e.target.matches('.filter-btn'))return;document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));e.target.classList.add('active');draw(e.target.dataset.cat)});
grid.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;openModal(findProject(el.dataset.id),el.dataset.action)});
modal.addEventListener('click',e=>{if(e.target.closest('[data-close-modal]'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal()});
document.getElementById('partnersTrack').innerHTML=[...partners,...partners].map(p=>`<div class="partner"><i></i>${esc(p)}</div>`).join('');
document.getElementById('year').textContent=new Date().getFullYear();
document.getElementById('menuBtn').onclick=()=>document.getElementById('navLinks').classList.toggle('open');
document.querySelectorAll('#navLinks a').forEach(a=>a.onclick=()=>document.getElementById('navLinks').classList.remove('open'));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
document.getElementById('orderForm').addEventListener('submit',async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button'),status=document.getElementById('orderStatus');btn.disabled=true;status.textContent='جاري إرسال الطلب...';const payload={name:document.getElementById('name').value.trim(),mobile:document.getElementById('phone').value.trim()||null,project_type:document.getElementById('type').value,message:document.getElementById('details').value.trim()};const {error}=await db.from('portfolio_requests').insert(payload);if(error){status.textContent='تعذر الإرسال الآن. يمكنك التواصل عبر البريد: '+cfg.adminEmail}else{e.currentTarget.reset();status.textContent='تم إرسال طلبك بنجاح، شكرًا لك.'}btn.disabled=false});
loadProjects();
