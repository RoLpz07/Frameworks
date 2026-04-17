class BehaviorSubject {
  constructor(current) {
    this.current = current;
    this.listeners = [];
  }

  get value() {
    return this.current;
  }

  next(value) {
    this.current = value;
    this.listeners.forEach((listener) => listener(value));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.current);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }
}

class AuthStore {
  constructor() {
    this.usersStorageKey = 'time.app.users';
    this.sessionStorageKey = 'time.app.session';
    this.users = new Map([
      ['demo@time.app', { name: 'Demo', password: '1234' }],
    ]);
    this.loadUsers();
    this.isAuthenticated$ = new BehaviorSubject(false);
    this.userName$ = new BehaviorSubject('Invitado');
    this.restoreSession();
  }

  loadUsers() {
    try {
      const raw = window.localStorage.getItem(this.usersStorageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return;
      }
      parsed.forEach((item) => {
        if (!item || typeof item.email !== 'string') {
          return;
        }
        const key = item.email.trim().toLowerCase();
        if (!key || typeof item.name !== 'string' || typeof item.password !== 'string') {
          return;
        }
        this.users.set(key, { name: item.name, password: item.password });
      });
    } catch {
      // If storage is unavailable or malformed, continue with in-memory users.
    }
  }

  saveUsers() {
    try {
      const serializable = Array.from(this.users.entries()).map(([email, data]) => ({
        email,
        name: data.name,
        password: data.password,
      }));
      window.localStorage.setItem(this.usersStorageKey, JSON.stringify(serializable));
    } catch {
      // Non-blocking persistence.
    }
  }

  completeAuth(name, email) {
    this.isAuthenticated$.next(true);
    this.userName$.next(name);
    try {
      window.localStorage.setItem(this.sessionStorageKey, email);
    } catch {
      // Non-blocking persistence.
    }
  }

  restoreSession() {
    try {
      const raw = window.localStorage.getItem(this.sessionStorageKey);
      const key = raw ? raw.trim().toLowerCase() : '';
      if (!key) {
        return;
      }
      const user = this.users.get(key);
      if (user) {
        this.completeAuth(user.name, key);
      }
    } catch {
      // Ignore restoration errors.
    }
  }

  register(name, email, password) {
    const cleanName = name.trim();
    const key = email.trim().toLowerCase();
    if (!cleanName || !key || !password || this.users.has(key)) {
      return false;
    }
    this.users.set(key, { name: cleanName, password });
    this.saveUsers();
    this.completeAuth(cleanName, key);
    return true;
  }

  login(email, password) {
    const key = email.trim().toLowerCase();
    const user = this.users.get(key);
    if (!user || user.password !== password) {
      return false;
    }
    this.completeAuth(user.name, key);
    return true;
  }

  logout() {
    this.isAuthenticated$.next(false);
    this.userName$.next('Invitado');
    try {
      window.localStorage.removeItem(this.sessionStorageKey);
    } catch {
      // Non-blocking persistence.
    }
  }
}

class TimeStore {
  constructor() {
    this.offsetSeconds$ = new BehaviorSubject(0);
    this.now$ = new BehaviorSubject(new Date());

    const tick = () => {
      const offset = this.offsetSeconds$.value * 1000;
      this.now$.next(new Date(Date.now() + offset));
    };

    tick();
    window.setInterval(tick, 1000);
    this.offsetSeconds$.subscribe(() => tick());
  }

  setOffsetSeconds(value) {
    this.offsetSeconds$.next(Math.trunc(value));
  }
}

class App {
  constructor() {
    this.views = [
      { id: 'digital', label: 'Digital', description: 'Lectura clasica HH:MM:SS con enfoque directo.' },
      { id: 'analog', label: 'Analogico SVG', description: 'Reloj circular con agujas de hora, minuto y segundo.' },
      { id: 'bars', label: 'Barras de progreso', description: 'Cada unidad de tiempo avanza como barra porcentual.' },
      { id: 'rings', label: 'Circulos concentricos', description: 'Tres anillos muestran progreso simultaneo.' },
      { id: 'binary', label: 'Matriz binaria', description: 'La hora expresada en bits por componente.' },
      { id: 'hourglass', label: 'Reloj de arena digital', description: 'Flujo visual de segundos en formato arena.' },
      { id: 'type', label: 'Tipografia dinamica', description: 'El tiempo modula tamano y espaciado tipografico.' },
      { id: 'orbital', label: 'Orbitas', description: 'Tres orbitas animadas para h, m y s.' },
      { id: 'columns', label: 'Columnas verticales', description: 'Alturas acumuladas por porcentaje de cada unidad.' },
      { id: 'timeline', label: 'Linea de tiempo', description: 'Marcadores horizontales para estado temporal actual.' },
    ];

    this.auth = new AuthStore();
    this.time = new TimeStore();
    this.hourMarks = Array.from({ length: 12 }, (_, index) => index * 30);

    this.mode = 'login';
    this.currentView = 'analog';
    this.isAuthenticated = false;

    this.h = 0;
    this.m = 0;
    this.s = 0;
    this.hDeg = 0;
    this.mDeg = 0;
    this.sDeg = 0;
    this.hPct = 0;
    this.mPct = 0;
    this.sPct = 0;

    this.appShell = this.must('#app');
    this.authScreen = this.must('#authScreen');
    this.dashboardScreen = this.must('#dashboardScreen');
    this.greeting = this.must('#greeting');
    this.viewTitle = this.must('#viewTitle');
    this.viewDescription = this.must('#viewDescription');
    this.viewerCard = this.must('#viewerCard');

    this.modeLoginBtn = this.must('#modeLogin');
    this.modeRegisterBtn = this.must('#modeRegister');
    this.nameRow = this.must('#nameRow');
    this.authForm = this.must('#authForm');
    this.nameInput = this.must('#nameInput');
    this.emailInput = this.must('#emailInput');
    this.passwordInput = this.must('#passwordInput');
    this.authSubmit = this.must('#authSubmit');
    this.authError = this.must('#authError');

    this.viewSelect = this.must('#viewSelect');
    this.offsetSlider = this.must('#offsetSlider');
    this.offsetLabel = this.must('#offsetLabel');
    this.logoutBtn = this.must('#logoutBtn');

    this.viewNodes = Array.from(document.querySelectorAll('[data-view]'));
    this.hourTicks = this.must('#hourTicks');

    this.digitalClock = this.must('#digitalClock');
    this.hHand = this.must('#hHand');
    this.mHand = this.must('#mHand');
    this.sHand = this.must('#sHand');

    this.barH = this.must('#barH');
    this.barM = this.must('#barM');
    this.barS = this.must('#barS');
    this.barHText = this.must('#barHText');
    this.barMText = this.must('#barMText');
    this.barSText = this.must('#barSText');

    this.ringHValue = this.must('#ringHValue');
    this.ringMValue = this.must('#ringMValue');
    this.ringSValue = this.must('#ringSValue');

    this.binH = this.must('#binH');
    this.binM = this.must('#binM');
    this.binS = this.must('#binS');

    this.hgTop = this.must('#hgTop');
    this.hgBottom = this.must('#hgBottom');
    this.hourglassTime = this.must('#hourglassTime');

    this.typeClock = this.must('#typeClock');

    this.orbH = this.must('#orbH');
    this.orbM = this.must('#orbM');
    this.orbS = this.must('#orbS');
    this.orbitalTime = this.must('#orbitalTime');

    this.colHFill = this.must('#colHFill');
    this.colMFill = this.must('#colMFill');
    this.colSFill = this.must('#colSFill');
    this.colHText = this.must('#colHText');
    this.colMText = this.must('#colMText');
    this.colSText = this.must('#colSText');

    this.lineH = this.must('#lineH');
    this.lineM = this.must('#lineM');
    this.lineS = this.must('#lineS');
    this.lineHText = this.must('#lineHText');
    this.lineMText = this.must('#lineMText');
    this.lineSText = this.must('#lineSText');
  }

  init() {
    this.emailInput.value = 'demo@time.app';
    this.passwordInput.value = '1234';
    this.authForm.setAttribute('novalidate', 'novalidate');
    this.setMode('login');
    this.renderViewOptions();
    this.renderHourTicks();
    this.bindEvents();

    this.auth.isAuthenticated$.subscribe((value) => {
      this.isAuthenticated = value;
      this.appShell.classList.toggle('is-authenticated', value);
      this.authScreen.hidden = value;
      this.dashboardScreen.hidden = !value;
      this.greeting.textContent = value ? `Hola, ${this.auth.userName$.value}` : '';
      if (value) {
        this.setView(this.currentView);
        this.authError.textContent = '';
      } else {
        this.passwordInput.value = '';
      }
    });

    this.auth.userName$.subscribe((name) => {
      this.greeting.textContent = this.isAuthenticated ? `Hola, ${name}` : '';
    });

    this.time.now$.subscribe((date) => {
      this.syncTime(date);
      this.renderAllViews();
    });
  }

  bindEvents() {
    this.modeLoginBtn.addEventListener('click', () => this.setMode('login'));
    this.modeRegisterBtn.addEventListener('click', () => this.setMode('register'));

    this.authForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.attemptAuth();
    });

    this.viewSelect.addEventListener('change', () => {
      this.setView(this.viewSelect.value);
    });

    this.offsetSlider.addEventListener('input', () => {
      const value = Number(this.offsetSlider.value);
      this.time.setOffsetSeconds(value);
      this.offsetLabel.textContent = `${value > 0 ? '+' : ''}${value}s`;
    });

    this.logoutBtn.addEventListener('click', () => this.auth.logout());
  }

  setMode(mode) {
    this.mode = mode;
    this.nameRow.hidden = mode !== 'register';
    this.modeLoginBtn.classList.toggle('active', mode === 'login');
    this.modeRegisterBtn.classList.toggle('active', mode === 'register');
    this.authSubmit.textContent = mode === 'login' ? 'Entrar' : 'Crear cuenta';
    this.authError.textContent = '';
  }

  attemptAuth() {
    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;
    const name = this.nameInput.value.trim();

    if (!email || !password || (this.mode === 'register' && !name)) {
      this.authError.textContent = 'Completa los campos requeridos.';
      return;
    }

    const ok =
      this.mode === 'login'
        ? this.auth.login(email, password)
        : this.auth.register(name, email, password);

    this.authError.textContent = ok
      ? ''
      : 'Credenciales invalidas o usuario ya existente.';
  }

  setView(view) {
    this.currentView = view;
    this.viewSelect.value = view;
    this.viewNodes.forEach((node) => {
      node.hidden = node.dataset.view !== view;
    });

    const current = this.views.find((item) => item.id === view);
    if (current) {
      this.viewTitle.textContent = current.label;
      this.viewDescription.textContent = current.description;
    }
  }

  renderViewOptions() {
    this.viewSelect.innerHTML = this.views
      .map((view) => `<option value="${view.id}">${view.label}</option>`)
      .join('');
    this.setView(this.currentView);
  }

  renderHourTicks() {
    this.hourTicks.innerHTML = this.hourMarks
      .map(
        (deg) =>
          `<line x1="100" y1="18" x2="100" y2="30" class="tick" transform="rotate(${deg} 100 100)"></line>`
      )
      .join('');
  }

  syncTime(date) {
    this.h = date.getHours();
    this.m = date.getMinutes();
    this.s = date.getSeconds();

    this.sDeg = this.s * 6;
    this.mDeg = this.m * 6 + this.s * 0.1;
    this.hDeg = (this.h % 12) * 30 + this.m * 0.5 + this.s / 120;

    this.hPct = (this.h / 23) * 100;
    this.mPct = (this.m / 59) * 100;
    this.sPct = (this.s / 59) * 100;

    this.viewerCard.style.setProperty('--hPct', `${this.hPct}%`);
    this.viewerCard.style.setProperty('--mPct', `${this.mPct}%`);
    this.viewerCard.style.setProperty('--sPct', `${this.sPct}%`);
  }

  renderAllViews() {
    const hh = this.pad(this.h);
    const mm = this.pad(this.m);
    const ss = this.pad(this.s);
    const clock = `${hh}:${mm}:${ss}`;

    this.digitalClock.textContent = clock;

    this.hHand.setAttribute('transform', `rotate(${this.hDeg} 100 100)`);
    this.mHand.setAttribute('transform', `rotate(${this.mDeg} 100 100)`);
    this.sHand.setAttribute('transform', `rotate(${this.sDeg} 100 100)`);

    this.barH.style.width = `${this.hPct}%`;
    this.barM.style.width = `${this.mPct}%`;
    this.barS.style.width = `${this.sPct}%`;
    this.barHText.textContent = hh;
    this.barMText.textContent = mm;
    this.barSText.textContent = ss;

    this.ringHValue.textContent = `${hh}h`;
    this.ringMValue.textContent = `${mm}m`;
    this.ringSValue.textContent = `${ss}s`;

    this.binH.innerHTML = this.bits(this.h, 5);
    this.binM.innerHTML = this.bits(this.m, 6);
    this.binS.innerHTML = this.bits(this.s, 6);

    this.hgTop.style.height = `${100 - this.sPct}%`;
    this.hgBottom.style.height = `${this.sPct}%`;
    this.hourglassTime.textContent = clock;

    this.typeClock.textContent = `${hh} ${mm} ${ss}`;
    this.typeClock.style.letterSpacing = `${this.s / 6}px`;
    this.typeClock.style.fontSize = `${50 + this.m / 2}px`;

    this.orbH.style.transform = `rotate(${this.hDeg}deg) translateX(74px)`;
    this.orbM.style.transform = `rotate(${this.mDeg}deg) translateX(54px)`;
    this.orbS.style.transform = `rotate(${this.sDeg}deg) translateX(34px)`;
    this.orbitalTime.textContent = `${hh} · ${mm} · ${ss}`;

    this.colHFill.style.height = `${this.hPct}%`;
    this.colMFill.style.height = `${this.mPct}%`;
    this.colSFill.style.height = `${this.sPct}%`;
    this.colHText.textContent = `H ${hh}`;
    this.colMText.textContent = `M ${mm}`;
    this.colSText.textContent = `S ${ss}`;

    this.lineH.style.left = `${this.hPct}%`;
    this.lineM.style.left = `${this.mPct}%`;
    this.lineS.style.left = `${this.sPct}%`;
    this.lineHText.textContent = hh;
    this.lineMText.textContent = mm;
    this.lineSText.textContent = ss;
  }

  bits(value, size) {
    return value
      .toString(2)
      .padStart(size, '0')
      .split('')
      .map((bit) => `<span class="${bit === '1' ? 'on' : ''}">${bit}</span>`)
      .join('');
  }

  pad(value) {
    return value.toString().padStart(2, '0');
  }

  must(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Elemento no encontrado: ${selector}`);
    }
    return element;
  }
}

new App().init();
