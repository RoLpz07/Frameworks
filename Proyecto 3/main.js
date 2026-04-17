(() => {
  const { useEffect, useMemo, useRef, useState } = React;
  const STORAGE_USERS = "portfolio_users_v1";
  const STORAGE_SESSION = "portfolio_session_v1";
  const DEFAULT_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
  function readJSON(key, fallbackValue) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallbackValue;
    } catch (error) {
      return fallbackValue;
    }
  }
  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function normalizeGithub(input) {
    const value = (input || "").trim();
    if (!value) return "";
    return value.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/^@/, "").split("/")[0].trim();
  }
  function createId() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function getVideoSource(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com")) {
        const id = parsed.searchParams.get("v");
        return id ? { type: "iframe", src: `https://www.youtube.com/embed/${id}` } : null;
      }
      if (parsed.hostname.includes("youtu.be")) {
        const id = parsed.pathname.replace("/", "");
        return id ? { type: "iframe", src: `https://www.youtube.com/embed/${id}` } : null;
      }
      if (parsed.hostname.includes("vimeo.com")) {
        const id = parsed.pathname.replace("/", "");
        return id ? { type: "iframe", src: `https://player.vimeo.com/video/${id}` } : null;
      }
      if (parsed.pathname.toLowerCase().endsWith(".mp4")) {
        return { type: "video", src: url };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  function App() {
    const [users, setUsers] = useState(() => readJSON(STORAGE_USERS, []));
    const [session, setSession] = useState(() => readJSON(STORAGE_SESSION, null));
    const [authMode, setAuthMode] = useState("login");
    const [message, setMessage] = useState("");
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [registerForm, setRegisterForm] = useState({
      name: "",
      email: "",
      password: "",
      github: ""
    });
    const currentUser = useMemo(() => {
      if (!session) return null;
      return users.find((user) => user.id === session.userId) || null;
    }, [session, users]);
    const persistUsers = (nextUsers) => {
      setUsers(nextUsers);
      writeJSON(STORAGE_USERS, nextUsers);
    };
    const startSession = (userId) => {
      const nextSession = { userId, loggedAt: (/* @__PURE__ */ new Date()).toISOString() };
      setSession(nextSession);
      writeJSON(STORAGE_SESSION, nextSession);
    };
    const closeSession = () => {
      setSession(null);
      localStorage.removeItem(STORAGE_SESSION);
      setMessage("Sesion finalizada correctamente.");
    };
    const updateCurrentUser = (updates) => {
      if (!currentUser) return;
      const nextUsers = users.map(
        (user) => user.id === currentUser.id ? { ...user, ...updates } : user
      );
      persistUsers(nextUsers);
    };
    const handleRegister = (event) => {
      event.preventDefault();
      setMessage("");
      const name = registerForm.name.trim();
      const email = registerForm.email.trim().toLowerCase();
      const password = registerForm.password.trim();
      const github = normalizeGithub(registerForm.github);
      if (!name || !email || !password || !github) {
        setMessage("Completa todos los campos para registrarte.");
        return;
      }
      if (password.length < 4) {
        setMessage("La contrasena debe tener al menos 4 caracteres.");
        return;
      }
      const alreadyExists = users.some((user) => user.email === email);
      if (alreadyExists) {
        setMessage("Ese correo ya esta registrado. Inicia sesion.");
        setAuthMode("login");
        return;
      }
      const newUser = {
        id: createId(),
        name,
        email,
        password,
        github,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const nextUsers = [...users, newUser];
      persistUsers(nextUsers);
      startSession(newUser.id);
      setRegisterForm({ name: "", email: "", password: "", github: "" });
      setMessage("Registro exitoso. Bienvenido a tu portafolio.");
    };
    const handleLogin = (event) => {
      event.preventDefault();
      setMessage("");
      const email = loginForm.email.trim().toLowerCase();
      const password = loginForm.password.trim();
      const matchedUser = users.find(
        (user) => user.email === email && user.password === password
      );
      if (!matchedUser) {
        setMessage("Credenciales invalidas. Verifica correo y contrasena.");
        return;
      }
      startSession(matchedUser.id);
      setLoginForm({ email: "", password: "" });
      setMessage("Inicio de sesion exitoso.");
    };
    if (!currentUser) {
      return /* @__PURE__ */ React.createElement("main", { className: "auth-page" }, /* @__PURE__ */ React.createElement("section", { className: "auth-card" }, /* @__PURE__ */ React.createElement("h1", null, "Portafolio Personal"), /* @__PURE__ */ React.createElement("p", { className: "subtitle" }, "Inicia sesion o registrate para ver tus proyectos de GitHub con evidencias, graficos y componentes interactivos."), /* @__PURE__ */ React.createElement("div", { className: "auth-switch" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: authMode === "login" ? "active" : "",
          onClick: () => setAuthMode("login"),
          type: "button"
        },
        "Iniciar sesion"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: authMode === "register" ? "active" : "",
          onClick: () => setAuthMode("register"),
          type: "button"
        },
        "Registrarme"
      )), authMode === "login" ? /* @__PURE__ */ React.createElement("form", { className: "auth-form", onSubmit: handleLogin }, /* @__PURE__ */ React.createElement("label", null, "Correo", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "email",
          value: loginForm.email,
          onChange: (event) => setLoginForm({ ...loginForm, email: event.target.value }),
          placeholder: "ejemplo@correo.com",
          required: true
        }
      )), /* @__PURE__ */ React.createElement("label", null, "Contrasena", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "password",
          value: loginForm.password,
          onChange: (event) => setLoginForm({ ...loginForm, password: event.target.value }),
          placeholder: "Ingresa tu contrasena",
          required: true
        }
      )), /* @__PURE__ */ React.createElement("button", { type: "submit" }, "Entrar")) : /* @__PURE__ */ React.createElement("form", { className: "auth-form", onSubmit: handleRegister }, /* @__PURE__ */ React.createElement("label", null, "Nombre", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: registerForm.name,
          onChange: (event) => setRegisterForm({ ...registerForm, name: event.target.value }),
          placeholder: "Tu nombre",
          required: true
        }
      )), /* @__PURE__ */ React.createElement("label", null, "Correo", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "email",
          value: registerForm.email,
          onChange: (event) => setRegisterForm({ ...registerForm, email: event.target.value }),
          placeholder: "ejemplo@correo.com",
          required: true
        }
      )), /* @__PURE__ */ React.createElement("label", null, "Contrasena", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "password",
          value: registerForm.password,
          onChange: (event) => setRegisterForm({ ...registerForm, password: event.target.value }),
          placeholder: "Minimo 4 caracteres",
          required: true
        }
      )), /* @__PURE__ */ React.createElement("label", null, "Usuario GitHub", /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: registerForm.github,
          onChange: (event) => setRegisterForm({ ...registerForm, github: event.target.value }),
          placeholder: "tu-usuario-github",
          required: true
        }
      )), /* @__PURE__ */ React.createElement("button", { type: "submit" }, "Crear cuenta")), message && /* @__PURE__ */ React.createElement("p", { className: "message" }, message)));
    }
    return /* @__PURE__ */ React.createElement(
      PortfolioPage,
      {
        user: currentUser,
        onLogout: closeSession,
        onUpdateUser: updateCurrentUser,
        globalMessage: message,
        setGlobalMessage: setMessage
      }
    );
  }
  function PortfolioPage({
    user,
    onLogout,
    onUpdateUser,
    globalMessage,
    setGlobalMessage
  }) {
    const [githubUser, setGithubUser] = useState(user.github || "");
    const [repos, setRepos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSlide, setActiveSlide] = useState(0);
    const [openRepoId, setOpenRepoId] = useState(null);
    const [activeTabByRepo, setActiveTabByRepo] = useState({});
    const langCanvasRef = useRef(null);
    const starsCanvasRef = useRef(null);
    const langChartRef = useRef(null);
    const starsChartRef = useRef(null);
    const featuredRepos = useMemo(() => {
      return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
    }, [repos]);
    const languageStats = useMemo(() => {
      const counters = {};
      repos.forEach((repo) => {
        if (repo.language) {
          counters[repo.language] = (counters[repo.language] || 0) + 1;
        }
      });
      return counters;
    }, [repos]);
    const starsStats = useMemo(() => {
      return [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 7);
    }, [repos]);
    const totalStars = useMemo(
      () => repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
      [repos]
    );
    const fetchRepos = async (username) => {
      const cleanUser = normalizeGithub(username);
      if (!cleanUser) {
        setError("Ingresa un usuario de GitHub valido.");
        setIsLoading(false);
        return;
      }
      setError("");
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://api.github.com/users/${cleanUser}/repos?per_page=100&sort=updated`
        );
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("No se encontro ese usuario en GitHub.");
          }
          if (response.status === 403) {
            throw new Error(
              "Limite de peticiones alcanzado en GitHub. Intenta de nuevo en unos minutos."
            );
          }
          throw new Error("No fue posible obtener los repositorios en este momento.");
        }
        const data = await response.json();
        const filtered = data.filter((repo) => !repo.fork);
        setRepos(filtered);
        setActiveSlide(0);
        if (!filtered.length) {
          setError("Este usuario no tiene repositorios publicos para mostrar.");
        }
      } catch (requestError) {
        setRepos([]);
        setError(requestError.message);
      } finally {
        setIsLoading(false);
      }
    };
    useEffect(() => {
      fetchRepos(githubUser);
    }, []);
    useEffect(() => {
      if (activeSlide > featuredRepos.length - 1) {
        setActiveSlide(0);
      }
    }, [featuredRepos, activeSlide]);
    useEffect(() => {
      if (langChartRef.current) {
        langChartRef.current.destroy();
        langChartRef.current = null;
      }
      if (starsChartRef.current) {
        starsChartRef.current.destroy();
        starsChartRef.current = null;
      }
      const langLabels = Object.keys(languageStats);
      if (langCanvasRef.current && langLabels.length) {
        langChartRef.current = new Chart(langCanvasRef.current, {
          type: "doughnut",
          data: {
            labels: langLabels,
            datasets: [
              {
                data: langLabels.map((label) => languageStats[label]),
                backgroundColor: [
                  "#fb8500",
                  "#219ebc",
                  "#ffb703",
                  "#023047",
                  "#8ecae6",
                  "#90be6d",
                  "#f28482"
                ]
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: "#2b2d42",
                  font: { family: "Manrope" }
                }
              }
            }
          }
        });
      }
      if (starsCanvasRef.current && starsStats.length) {
        starsChartRef.current = new Chart(starsCanvasRef.current, {
          type: "bar",
          data: {
            labels: starsStats.map((repo) => repo.name),
            datasets: [
              {
                label: "Estrellas",
                data: starsStats.map((repo) => repo.stargazers_count),
                backgroundColor: "#219ebc",
                borderRadius: 8
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: "#2b2d42",
                  font: { family: "Manrope" }
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  color: "#4a4e69",
                  font: { family: "Manrope" }
                },
                grid: { display: false }
              },
              y: {
                ticks: {
                  color: "#4a4e69",
                  font: { family: "Manrope" }
                },
                grid: {
                  color: "rgba(2, 48, 71, 0.12)"
                }
              }
            }
          }
        });
      }
      return () => {
        if (langChartRef.current) {
          langChartRef.current.destroy();
          langChartRef.current = null;
        }
        if (starsChartRef.current) {
          starsChartRef.current.destroy();
          starsChartRef.current = null;
        }
      };
    }, [languageStats, starsStats]);
    const goNext = () => {
      if (!featuredRepos.length) return;
      setActiveSlide((prev) => (prev + 1) % featuredRepos.length);
    };
    const goPrev = () => {
      if (!featuredRepos.length) return;
      setActiveSlide(
        (prev) => prev === 0 ? featuredRepos.length - 1 : prev - 1
      );
    };
    const submitGithubUser = (event) => {
      event.preventDefault();
      const clean = normalizeGithub(githubUser);
      if (!clean) {
        setError("Ingresa un usuario de GitHub valido.");
        return;
      }
      setGithubUser(clean);
      onUpdateUser({ github: clean });
      fetchRepos(clean);
      setGlobalMessage("Perfil de GitHub actualizado.");
    };
    const switchTab = (repoId, tabName) => {
      setActiveTabByRepo((previous) => ({ ...previous, [repoId]: tabName }));
    };
    return /* @__PURE__ */ React.createElement("div", { className: "app-shell" }, /* @__PURE__ */ React.createElement("header", { className: "navbar", id: "inicio" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, "PORTAFOLIO"), /* @__PURE__ */ React.createElement("nav", null, /* @__PURE__ */ React.createElement("a", { href: "#proyectos" }, "Proyectos"), /* @__PURE__ */ React.createElement("a", { href: "#estadisticas" }, "Graficos"), /* @__PURE__ */ React.createElement("a", { href: "#contacto" }, "Contacto")), /* @__PURE__ */ React.createElement("button", { className: "ghost", onClick: onLogout }, "Cerrar sesion")), /* @__PURE__ */ React.createElement("section", { className: "hero" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "eyebrow" }, "Bienvenido, ", user.name), /* @__PURE__ */ React.createElement("h2", null, "Tu espacio para mostrar trabajos, evidencia y codigo."), /* @__PURE__ */ React.createElement("p", null, "Repositorios cargados desde GitHub: ", /* @__PURE__ */ React.createElement("strong", null, repos.length), " | ", "Estrellas totales: ", /* @__PURE__ */ React.createElement("strong", null, totalStars)), globalMessage && /* @__PURE__ */ React.createElement("p", { className: "message" }, globalMessage)), /* @__PURE__ */ React.createElement("form", { className: "github-form", onSubmit: submitGithubUser }, /* @__PURE__ */ React.createElement("label", null, "Usuario GitHub", /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: githubUser,
        onChange: (event) => setGithubUser(event.target.value),
        placeholder: "tu-usuario"
      }
    )), /* @__PURE__ */ React.createElement("button", { type: "submit" }, "Actualizar"), /* @__PURE__ */ React.createElement(
      "a",
      {
        className: "ghost",
        href: `https://github.com/${normalizeGithub(githubUser) || user.github}`,
        target: "_blank",
        rel: "noreferrer"
      },
      "Ver perfil"
    ))), /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement("section", { id: "proyectos", className: "section-block" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, /* @__PURE__ */ React.createElement("h3", null, "Proyectos destacados (Carousel/Slider)")), isLoading ? /* @__PURE__ */ React.createElement("p", null, "Cargando repositorios...") : error ? /* @__PURE__ */ React.createElement("p", { className: "error-text" }, error) : featuredRepos.length ? /* @__PURE__ */ React.createElement("div", { className: "carousel-wrapper" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "carousel-btn", onClick: goPrev }, "\u2039"), /* @__PURE__ */ React.createElement("div", { className: "carousel-window" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "carousel-track",
        style: { transform: `translateX(-${activeSlide * 100}%)` }
      },
      featuredRepos.map((repo) => /* @__PURE__ */ React.createElement("article", { className: "carousel-slide", key: repo.id }, /* @__PURE__ */ React.createElement(
        "img",
        {
          src: `https://opengraph.githubassets.com/1/${repo.full_name}`,
          alt: `Vista de ${repo.name}`,
          loading: "lazy"
        }
      ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, repo.name), /* @__PURE__ */ React.createElement("p", null, repo.description || "Sin descripcion disponible."), /* @__PURE__ */ React.createElement("p", null, "\u2B50 ", repo.stargazers_count, " \xB7 \u{1F374} ", repo.forks_count, " \xB7 \u{1F9E0}", " ", repo.language || "N/A"), /* @__PURE__ */ React.createElement("a", { href: repo.html_url, target: "_blank", rel: "noreferrer" }, "Ver codigo"))))
    )), /* @__PURE__ */ React.createElement("button", { type: "button", className: "carousel-btn", onClick: goNext }, "\u203A")) : /* @__PURE__ */ React.createElement("p", null, "No hay repositorios para mostrar.")), /* @__PURE__ */ React.createElement("section", { className: "section-block projects-grid-section" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, /* @__PURE__ */ React.createElement("h3", null, "Todos los proyectos (Tabs + Accordion)")), /* @__PURE__ */ React.createElement("div", { className: "projects-grid" }, repos.map((repo) => {
      const activeTab = activeTabByRepo[repo.id] || "imagen";
      const videoSource = getVideoSource(repo.homepage);
      return /* @__PURE__ */ React.createElement("article", { className: "project-card", key: repo.id }, /* @__PURE__ */ React.createElement("h4", null, repo.name), /* @__PURE__ */ React.createElement("p", null, repo.description || "Sin descripcion disponible."), /* @__PURE__ */ React.createElement("div", { className: "tabs" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: activeTab === "imagen" ? "active" : "",
          onClick: () => switchTab(repo.id, "imagen")
        },
        "Imagen"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: activeTab === "video" ? "active" : "",
          onClick: () => switchTab(repo.id, "video")
        },
        "Video"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: activeTab === "codigo" ? "active" : "",
          onClick: () => switchTab(repo.id, "codigo")
        },
        "Codigo"
      )), /* @__PURE__ */ React.createElement("div", { className: "tab-content" }, activeTab === "imagen" && /* @__PURE__ */ React.createElement(
        "img",
        {
          src: `https://opengraph.githubassets.com/1/${repo.full_name}`,
          alt: `Imagen del repositorio ${repo.name}`,
          loading: "lazy"
        }
      ), activeTab === "video" && /* @__PURE__ */ React.createElement("div", { className: "media-box" }, (videoSource == null ? void 0 : videoSource.type) === "iframe" ? /* @__PURE__ */ React.createElement(
        "iframe",
        {
          src: videoSource.src,
          title: `Video demo de ${repo.name}`,
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowFullScreen: true
        }
      ) : /* @__PURE__ */ React.createElement(
        "video",
        {
          controls: true,
          src: (videoSource == null ? void 0 : videoSource.src) || DEFAULT_VIDEO,
          preload: "metadata"
        }
      )), activeTab === "codigo" && /* @__PURE__ */ React.createElement("pre", null, `git clone ${repo.clone_url}
cd ${repo.name}
# Rama principal: ${repo.default_branch}
# Lenguaje: ${repo.language || "N/A"}`)), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "accordion-toggle",
          onClick: () => setOpenRepoId(
            (previous) => previous === repo.id ? null : repo.id
          )
        },
        openRepoId === repo.id ? "Ocultar detalles" : "Ver detalles"
      ), openRepoId === repo.id && /* @__PURE__ */ React.createElement("div", { className: "accordion-content" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Actualizado:"), " ", new Date(repo.updated_at).toLocaleDateString()), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Lenguaje:"), " ", repo.language || "No definido"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "URL del proyecto:"), " ", /* @__PURE__ */ React.createElement("a", { href: repo.html_url, target: "_blank", rel: "noreferrer" }, repo.full_name)), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Pagina/demo:"), " ", repo.homepage ? /* @__PURE__ */ React.createElement("a", { href: repo.homepage, target: "_blank", rel: "noreferrer" }, repo.homepage) : "No configurada")));
    }))), /* @__PURE__ */ React.createElement("section", { id: "estadisticas", className: "section-block charts-section" }, /* @__PURE__ */ React.createElement("div", { className: "section-title" }, /* @__PURE__ */ React.createElement("h3", null, "Graficos / Charts")), /* @__PURE__ */ React.createElement("div", { className: "charts-grid" }, /* @__PURE__ */ React.createElement("article", { className: "chart-card" }, /* @__PURE__ */ React.createElement("h4", null, "Distribucion por lenguaje"), /* @__PURE__ */ React.createElement("div", { className: "canvas-wrap" }, /* @__PURE__ */ React.createElement("canvas", { ref: langCanvasRef }))), /* @__PURE__ */ React.createElement("article", { className: "chart-card" }, /* @__PURE__ */ React.createElement("h4", null, "Repositorios con mas estrellas"), /* @__PURE__ */ React.createElement("div", { className: "canvas-wrap" }, /* @__PURE__ */ React.createElement("canvas", { ref: starsCanvasRef })))))), /* @__PURE__ */ React.createElement("footer", { id: "contacto", className: "footer" }, /* @__PURE__ */ React.createElement("p", null, "Portafolio personal hecho en React con JavaScript puro."), /* @__PURE__ */ React.createElement("p", null, "GitHub: ", /* @__PURE__ */ React.createElement("a", { href: `https://github.com/${user.github}` }, "@", user.github))));
  }
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();
