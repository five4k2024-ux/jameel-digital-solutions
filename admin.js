const cfg = window.PORTFOLIO_CONFIG;
const db = window.supabase.createClient(cfg.url, cfg.key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: true
  }
});
let projectCache = [];
let recoveryMode = false;
let authReady = false;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const isAllowedAdminEmail = email => String(email || '').toLowerCase() === cfg.adminEmail.toLowerCase();

async function isAdmin() {
  const { data: { user } } = await db.auth.getUser();
  return !!user && isAllowedAdminEmail(user.email);
}

async function refreshAuth() {
  // Fail closed: dashboard stays hidden until authentication is verified.
  $('dashboard').hidden = true;

  if (recoveryMode) {
    $('loginView').hidden = false;
    $('loginForm').hidden = true;
    $('recoveryForm').hidden = false;
    authReady = true;
    return;
  }

  const ok = await isAdmin();
  authReady = true;
  $('loginView').hidden = ok;
  $('dashboard').hidden = !ok;
  document.body.classList.toggle('admin-authenticated', ok);
  $('loginForm').hidden = false;
  $('recoveryForm').hidden = true;

  if (ok) {
    await loadProjects();
    await loadRequests();
  }
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = $('loginStatus');
  const password = $('adminPassword').value;

  status.textContent = 'جاري تسجيل الدخول...';
  const { data, error } = await db.auth.signInWithPassword({
    email: cfg.adminEmail,
    password
  });

  if (error) {
    status.textContent = 'تعذر تسجيل الدخول. تأكد من كلمة المرور أو استخدم «نسيت كلمة المرور».';
    return;
  }

  if (!data.user || !isAllowedAdminEmail(data.user.email)) {
    await db.auth.signOut();
    status.textContent = 'هذا الحساب غير مخول للدخول إلى لوحة الإدارة.';
    return;
  }

  status.textContent = 'تم تسجيل الدخول بنجاح.';
  $('adminPassword').value = '';
  await refreshAuth();
});

$('forgotPasswordBtn').addEventListener('click', async () => {
  const status = $('loginStatus');
  status.textContent = 'جاري إرسال رسالة الاستعادة...';

  const redirectTo = new URL('admin.html', window.location.href).href;
  const { error } = await db.auth.resetPasswordForEmail(cfg.adminEmail, { redirectTo });

  status.textContent = error
    ? 'تعذر إرسال رسالة الاستعادة: ' + error.message
    : 'تم إرسال رسالة استعادة كلمة المرور إلى بريد المدير. افتح الرسالة واضغط رابط الاستعادة.';
});

$('recoveryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = $('recoveryStatus');
  const password = $('newPassword').value;
  const confirmPassword = $('confirmPassword').value;

  if (password.length < 12) {
    status.textContent = 'كلمة المرور يجب أن تكون 12 حرفًا على الأقل.';
    return;
  }

  if (password !== confirmPassword) {
    status.textContent = 'كلمتا المرور غير متطابقتين.';
    return;
  }

  status.textContent = 'جاري حفظ كلمة المرور الجديدة...';
  const { error } = await db.auth.updateUser({ password });

  if (error) {
    status.textContent = 'تعذر تغيير كلمة المرور: ' + error.message;
    return;
  }

  recoveryMode = false;
  $('newPassword').value = '';
  $('confirmPassword').value = '';
  status.textContent = 'تم تغيير كلمة المرور بنجاح.';
  history.replaceState({}, document.title, location.pathname);
  await refreshAuth();
});

$('logoutBtn').onclick = async () => {
  await db.auth.signOut();
  recoveryMode = false;
  $('dashboard').hidden = true;
  $('loginView').hidden = false;
  $('loginForm').hidden = false;
  $('recoveryForm').hidden = true;
  $('adminPassword').value = '';
  history.replaceState({}, document.title, 'admin.html');
};

async function loadProjects() {
  const { data, error } = await db.from('portfolio_projects').select('*').order('sort_order');
  if (error) return alert('تعذر تحميل المشاريع');
  projectCache = data || [];
  $('adminProjects').innerHTML = projectCache.map(p => `
    <article class="admin-row ${p.is_published ? '' : 'muted'}">
      <div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.short_description)}</p>
        <span class="request-meta">${esc(p.category)} • ${p.is_published ? 'ظاهر للزوار' : 'مخفي'}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-small" onclick="editProject('${p.id}')">تعديل</button>
        <button class="btn btn-small btn-ghost" onclick="toggleProject('${p.id}',${!p.is_published})">${p.is_published ? 'إخفاء' : 'إظهار'}</button>
        <button class="btn btn-small danger" onclick="deleteProject('${p.id}')">حذف</button>
      </div>
    </article>`).join('');
}

window.editProject = id => {
  const p = projectCache.find(x => x.id === id);
  if (!p) return;
  $('projectId').value = p.id;
  $('pTitle').value = p.title;
  $('pCategory').value = p.category;
  $('pShort').value = p.short_description;
  $('pLong').value = p.long_description || '';
  $('pTags').value = (p.tech_tags || []).join(', ');
  $('pOrder').value = p.sort_order;
  $('pPublished').checked = p.is_published;
  $('formTitle').textContent = 'تعديل المشروع';
  scrollTo({ top: 0, behavior: 'smooth' });
};

window.toggleProject = async (id, value) => {
  const { error } = await db.from('portfolio_projects').update({ is_published: value }).eq('id', id);
  if (error) alert(error.message); else loadProjects();
};

window.deleteProject = async id => {
  if (!confirm('هل تريد حذف المشروع من قاعدة البيانات؟ يمكنك استخدام إخفاء إذا أردت الاحتفاظ به.')) return;
  const { error } = await db.from('portfolio_projects').delete().eq('id', id);
  if (error) alert(error.message); else loadProjects();
};

async function upload(file, kind) {
  if (!file) return null;
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${kind}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(cfg.bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return db.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl;
}

$('projectForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = $('projectStatus');
  status.textContent = 'جاري الحفظ...';

  try {
    const image = await upload($('pImage').files[0], 'images');
    const video = await upload($('pVideo').files[0], 'videos');
    const id = $('projectId').value;
    const payload = {
      title: $('pTitle').value.trim(),
      slug: (id ? (projectCache.find(x => x.id === id)?.slug) : null) || ('project-' + Date.now()),
      category: $('pCategory').value.trim(),
      short_description: $('pShort').value.trim(),
      long_description: $('pLong').value.trim(),
      tech_tags: $('pTags').value.split(',').map(x => x.trim()).filter(Boolean),
      sort_order: Number($('pOrder').value || 100),
      is_published: $('pPublished').checked
    };
    if (image) payload.cover_url = image;
    if (video) payload.video_url = video;

    const q = id
      ? db.from('portfolio_projects').update(payload).eq('id', id)
      : db.from('portfolio_projects').insert(payload);
    const { error } = await q;
    if (error) throw error;

    status.textContent = 'تم الحفظ بنجاح';
    resetForm();
    await loadProjects();
  } catch (err) {
    status.textContent = 'تعذر الحفظ: ' + err.message;
  }
});

function resetForm() {
  $('projectForm').reset();
  $('projectId').value = '';
  $('pOrder').value = 100;
  $('pPublished').checked = true;
  $('formTitle').textContent = 'إضافة مشروع';
}
$('cancelEdit').onclick = resetForm;

async function loadRequests() {
  const { data } = await db.from('portfolio_requests').select('*').order('created_at', { ascending: false });
  $('requestsList').innerHTML = (data || []).map(r => `
    <article class="admin-row">
      <div>
        <h3>${esc(r.name)} — ${esc(r.project_type || 'طلب مشروع')}</h3>
        <p>${esc(r.message)}</p>
        <span class="request-meta">${esc(r.mobile || 'بدون رقم')} • ${new Date(r.created_at).toLocaleString('ar-SA')}</span>
      </div>
      <div class="row-actions"><button class="btn btn-small danger" onclick="deleteRequest('${r.id}')">حذف</button></div>
    </article>`).join('') || '<div class="admin-panel">لا توجد طلبات حتى الآن.</div>';
}

window.deleteRequest = async id => {
  if (!confirm('حذف الطلب؟')) return;
  await db.from('portfolio_requests').delete().eq('id', id);
  loadRequests();
};

document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  $('projectsTab').hidden = b.dataset.tab !== 'projects';
  $('requestsTab').hidden = b.dataset.tab !== 'requests';
});

db.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') recoveryMode = true;
  setTimeout(refreshAuth, 0);
});

refreshAuth();
