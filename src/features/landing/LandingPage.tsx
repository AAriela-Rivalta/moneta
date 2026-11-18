import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  Heart,
  Lightbulb,
  LockKeyhole,
  Menu,
  PiggyBank,
  ShieldCheck,
  Smartphone,
  Target,
  WalletCards,
  X,
} from "lucide-react";
import "./landing.css";

const APP_URL = "/app";
const GITHUB_URL = "https://github.com/AAriela-Rivalta/moneta";
const photos = [
  {
    title: "Dashboard",
    sub: "Un panorama claro de tu dinero.",
    src: "/screens/dashboard.png",
  },
  {
    title: "Movimientos",
    sub: "Cada ingreso y gasto, bajo control.",
    src: "/screens/movimientos.png",
  },
  {
    title: "Presupuestos",
    sub: "Sabé cuánto te queda por gastar.",
    src: "/screens/presupuestos.png",
  },
  {
    title: "Objetivos de ahorro",
    sub: "Tus metas, con un plan.",
    src: "/screens/objetivos.png",
  },
  {
    title: "Asistente financiero",
    sub: "Recomendaciones basadas en tus datos.",
    src: "/screens/asistente.png",
  },
];
const capabilities = [
  {
    icon: WalletCards,
    title: "Registrá con facilidad",
    desc: "Anotá tus ingresos y gastos, buscá movimientos y encontrá todo en un mismo lugar.",
    color: "bg-[#e6f4fa] text-[#207cae]",
  },
  {
    icon: Camera,
    title: "Sacale una foto al ticket",
    desc: "Moneta identifica comercio, fecha y monto desde una imagen para ayudarte a cargar el gasto.",
    color: "bg-[#feede9] text-[#ed604d]",
  },
  {
    icon: Target,
    title: "Poneles límites a tus gastos",
    desc: "Creá presupuestos por categoría y recibí alertas cuando te acerques al límite.",
    color: "bg-[#eeeafe] text-[#6d52cd]",
  },
  {
    icon: PiggyBank,
    title: "Ahorrá para lo que querés",
    desc: "Definí objetivos, registrá aportes y simulá cuánto necesitás ahorrar cada mes.",
    color: "bg-[#e4f5eb] text-[#24865e]",
  },
  {
    icon: BarChart3,
    title: "Descubrí tus hábitos",
    desc: "Compará períodos, explorá estadísticas y detectá compras que se repiten.",
    color: "bg-[#fff3df] text-[#bb7b17]",
  },
  {
    icon: Lightbulb,
    title: "Decidí con más información",
    desc: "Recibí alertas y sugerencias de un asistente que analiza tus propios movimientos.",
    color: "bg-[#e6f4fa] text-[#207cae]",
  },
];

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
function useInstall() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const handle = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", handle);
    window.addEventListener("appinstalled", installedHandler);
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone
    )
      setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handle);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);
  const install = async () => {
    if (!promptEvent) return false;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
    return true;
  };
  return { canInstall: !!promptEvent, installed, install };
}
function Logo() {
  return (
    <a
      href="#inicio"
      aria-label="Moneta, ir al inicio"
      className="inline-flex items-center gap-2.5"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#227eb0] text-white shadow-sm">
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 19V7l9 9 9-9v12"
            stroke="white"
            strokeWidth="3.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute top-1 right-1 h-[6px] w-[6px] rounded-full bg-[#fa6852]" />
      </span>
      <span className="text-[23px] font-extrabold tracking-[-.045em] text-[#18364b]">
        Moneta
      </span>
    </a>
  );
}
function Primary({
  children,
  href = APP_URL,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const cls =
    "inline-flex items-center justify-center gap-2 rounded-[13px] bg-[#207eaf] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(32,126,175,.18)] transition hover:bg-[#176993] hover:-translate-y-0.5";
  return onClick ? (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  ) : (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}
function App() {
  const [active, setActive] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const { canInstall, installed, install } = useInstall();
  const [faq, setFaq] = useState<number | null>(null);
  const selected = photos[active];
  const installAction = async () => {
  if (installed) {
    window.location.href = '/app';
    return;
  }

  if (canInstall) {
    await install();
  } else {
    setInstallOpen(true);
  }
};
  return (
    <div className="landing-page overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-[#e8e5df] bg-[#fdfcf9]/95 backdrop-blur-md nav-shadow">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-9 text-[14px] font-medium text-[#5c6c76] md:flex">
            <a href="#beneficios" className="hover:text-[#197aac]">
              Beneficios
            </a>
            <a href="#explora" className="hover:text-[#197aac]">
              Conocé Moneta
            </a>
            <a href="#instalar" className="hover:text-[#197aac]">
              Cómo instalar
            </a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={installAction}
              className="px-3 py-2 text-sm font-semibold text-[#207eaf] hover:underline"
            >
              {installed ? "Abrir Moneta" : "Instalar app"}
            </button>
            <Primary>
              Ir a Moneta <ArrowUpRight size={17} />
            </Primary>
          </div>
          <button
            className="rounded-lg p-2 text-[#18435e] md:hidden"
            onClick={() => setMobile(!mobile)}
            aria-label={mobile ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobile}
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
        {mobile && (
          <nav className="flex flex-col gap-4 border-t border-[#e8e5df] bg-white px-6 py-5 text-[#26475b] md:hidden">
            <a href="#beneficios" onClick={() => setMobile(false)}>
              Beneficios
            </a>
            <a href="#explora" onClick={() => setMobile(false)}>
              Conocé Moneta
            </a>
            <a href="#instalar" onClick={() => setMobile(false)}>
              Cómo instalar
            </a>
            <a href={APP_URL} className="font-bold text-[#207eaf]">
              Abrir aplicación
            </a>
          </nav>
        )}
      </header>
      <main>
        <section
          id="inicio"
          className="relative isolate bg-[#f7f4ee] pt-16 pb-20 md:pt-24 md:pb-28"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-[80%] w-[34%] opacity-30 hero-dots" />
          <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-16 px-5 md:px-8 lg:grid-cols-[.88fr_1.12fr] lg:gap-10">
            <div className="max-w-[570px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d2e6ee] bg-white px-4 py-2 text-xs font-bold text-[#237dab]">
                <span className="h-2 w-2 rounded-full bg-[#30a77d]" /> Tu
                tranquilidad financiera empieza acá
              </div>
              <h1 className="text-balance text-[clamp(3rem,5.5vw,5.55rem)] leading-[1.07] font-extrabold tracking-[-.045em] text-[#142c3f]">
                Tu plata,
                <br />
                <span className="text-[#237faf]">más clara.</span>
                <br />
                Tu futuro,
                <br />
                más cerca.
              </h1>
              <p className="mt-7 max-w-[490px] text-[17px] leading-[1.75] text-[#627582]">
                Organizá tus ingresos y gastos, entendé tus hábitos y convertí
                tus objetivos en planes reales. Todo desde un solo lugar.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Primary>
                  Empezar a usar Moneta <ArrowRight size={18} />
                </Primary>
                <a
                  href="#explora"
                  className="inline-flex items-center gap-2 rounded-[13px] border border-[#d7e0e4] bg-white px-5 py-3.5 text-[15px] font-semibold text-[#315267] transition hover:bg-[#eff7fa]"
                >
                  Explorar funciones <ChevronDown size={17} />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#677b84]">
                <span className="inline-flex items-center gap-2">
                  <Check size={16} className="text-[#1a9b72]" /> Gratis
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check size={16} className="text-[#1a9b72]" /> Sin crear
                  cuenta
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check size={16} className="text-[#1a9b72]" /> Datos en tu
                  navegador
                </span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[710px] lg:max-w-none">
              <div className="absolute -top-9 right-4 h-36 w-36 rounded-full bg-[#d6eaf3] blur-[2px] md:h-52 md:w-52" />
              <div className="absolute -bottom-12 left-0 h-44 w-44 rounded-full bg-[#fae2d5] blur-[3px] md:h-60 md:w-60" />
              <div className="relative overflow-hidden rounded-[18px] border-[6px] border-[#fff] bg-white soft-shadow md:rotate-[1.2deg]">
                <div className="flex h-9 items-center gap-1.5 border-b border-[#e9edf0] bg-[#fcfcfb] px-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f5a69c]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f6d6a4]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#a9d9c7]" />
                  <span className="ml-auto text-[10px] font-medium text-[#9cabb3]">
                    Moneta · Panel financiero
                  </span>
                </div>
                <img
                  src="/screens/dashboard.png"
                  alt="Dashboard de Moneta con saldo, ingresos, gastos y gráficos"
                  className="block w-full"
                />
              </div>
              <div className="float-slow absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_rgba(27,54,73,.14)] sm:flex">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f5ed] text-[#21966c]">
                  <PiggyBank size={21} />
                </span>
                <span>
                  <strong className="block text-sm text-[#223e50]">
                    Metas de ahorro
                  </strong>
                  <small className="text-xs text-[#81909a]">
                    Cada paso cuenta
                  </small>
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-[#dce9ee] bg-[#ecf5f8] py-7">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-12 gap-y-5 px-5 text-sm font-semibold text-[#4a788f] md:justify-between md:px-8">
            <span className="flex items-center gap-2.5">
              <ShieldCheck size={20} /> Sin cuentas bancarias vinculadas
            </span>
            <span className="flex items-center gap-2.5">
              <LockKeyhole size={20} /> Tus datos se guardan localmente
            </span>
            <span className="flex items-center gap-2.5">
              <Smartphone size={20} /> En compu y celular
            </span>
          </div>
        </section>
        <section
          id="beneficios"
          className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 md:py-32"
        >
          <div className="max-w-2xl">
            <h2 className="text-balance text-[clamp(2.1rem,4vw,3.4rem)] leading-[1.17] font-extrabold tracking-[-.035em]">
              Menos dudas con tu dinero.{" "}
              <span className="text-[#237faf]">Más decisiones a tu favor.</span>
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-[#647887]">
              Desde el gasto de todos los días hasta ese objetivo que querés
              cumplir: Moneta te ayuda a ver el panorama completo.
            </p>
          </div>
          <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="max-w-[360px]">
                <span
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] ${color}`}
                >
                  <Icon size={24} strokeWidth={1.9} />
                </span>
                <h3 className="text-[19px] font-bold tracking-[-.02em]">
                  {title}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.8] text-[#697b85]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section id="explora" className="bg-[#e9f2f6] py-24 md:py-28">
          <div className="mx-auto max-w-[1240px] px-5 md:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h2 className="text-[clamp(2.1rem,4vw,3.45rem)] leading-tight font-extrabold tracking-[-.035em]">
                  Conocé Moneta por dentro.
                </h2>
                <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#657988]">
                  Una experiencia simple y visual, pensada para que entender tus
                  finanzas no sea complicado.
                </p>
              </div>
              <span className="text-sm font-semibold text-[#568199]">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(photos.length).padStart(2, "0")} pantallas
              </span>
            </div>
            <div className="mt-10 grid items-center gap-9 lg:grid-cols-[.32fr_.68fr]">
              <div className="flex flex-col gap-2">
                {photos.map((p, i) => (
                  <button
                    key={p.title}
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className={`flex items-center justify-between rounded-xl px-5 py-4 text-left transition ${i === active ? "bg-[#207eaf] text-white shadow-md" : "text-[#4b6576] hover:bg-white/60"}`}
                  >
                    <span>
                      <span className="block text-[16px] font-bold">
                        {p.title}
                      </span>
                      <span
                        className={`mt-1 block text-[13px] ${i === active ? "text-[#d7ecf4]" : "text-[#7d909b]"}`}
                      >
                        {p.sub}
                      </span>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-2xl border-[5px] border-white bg-white shadow-[0_26px_60px_rgba(37,76,98,.13)]">
                <div className="flex items-center justify-between border-b border-[#e9ecee] px-4 py-3">
                  <span className="text-xs font-semibold text-[#527183]">
                    {selected.title}
                  </span>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#c6dbe4]" />
                    <span className="h-2 w-2 rounded-full bg-[#c6dbe4]" />
                    <span className="h-2 w-2 rounded-full bg-[#c6dbe4]" />
                  </div>
                </div>
                <img
                  key={selected.src}
                  src={selected.src}
                  alt={`Captura de la sección ${selected.title} de Moneta`}
                  className="block w-full"
                />
                <div className="flex items-center justify-between border-t border-[#e9ecee] px-4 py-3 text-xs text-[#718895]">
                  <span>Vista real del proyecto</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setActive((active + photos.length - 1) % photos.length)
                      }
                      aria-label="Pantalla anterior"
                      className="rounded-lg border border-[#dce5e9] p-2 hover:bg-[#f1f7f9]"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setActive((active + 1) % photos.length)}
                      aria-label="Pantalla siguiente"
                      className="rounded-lg border border-[#dce5e9] p-2 hover:bg-[#f1f7f9]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-[1240px] items-center gap-14 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-2">
          <div className="relative rounded-[22px] bg-[#183f59] p-6 text-white shadow-xl sm:p-9">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#c1dfec]">
                <Heart size={17} /> Tu salud financiera
              </span>
              <span className="rounded-full bg-[#28607d] px-3 py-1 text-xs text-[#d8f0f9]">
                Análisis del mes
              </span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-7">
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-[12px] border-[#42a9d3] bg-[#225674]">
                <div className="text-center">
                  <strong className="block text-5xl font-extrabold">77</strong>
                  <span className="text-xs text-[#c0dfec]">de 100</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">Vas por buen camino</p>
                <p className="mt-2 max-w-[200px] text-sm leading-relaxed text-[#b6d4e2]">
                  Un resumen de ahorro, presupuestos, gastos y objetivos.
                </p>
              </div>
            </div>
            <div className="mt-10 space-y-4">
              {[
                ["Ahorro", 71],
                ["Presupuestos", 76],
                ["Tendencia de gasto", 92],
                ["Objetivos", 65],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-xs font-medium text-[#d5e8f0]">
                    <span>{label}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#386a82]">
                    <div
                      className="h-full rounded-full bg-[#56bbe0]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-[#a5c1d1]">
              Ejemplo con datos de demostración.
            </p>
          </div>
          <div>
            <h2 className="text-[clamp(2.1rem,4vw,3.45rem)] leading-[1.15] font-extrabold tracking-[-.035em]">
              No es solo registrar gastos.{" "}
              <span className="text-[#237faf]">Es entenderlos.</span>
            </h2>
            <p className="mt-6 text-[17px] leading-[1.8] text-[#627888]">
              El asistente de Moneta analiza tus movimientos, detecta patrones y
              genera recomendaciones personalizadas con un sistema de reglas
              propio.
            </p>
            <div className="mt-8 space-y-4 text-[15px] font-medium text-[#365264]">
              <p className="flex items-start gap-3">
                <Check className="mt-0.5 shrink-0 text-[#159a76]" size={19} />{" "}
                Alertas sobre presupuestos y cambios en tus gastos.
              </p>
              <p className="flex items-start gap-3">
                <Check className="mt-0.5 shrink-0 text-[#159a76]" size={19} />{" "}
                Proyecciones para anticiparte al cierre del mes.
              </p>
              <p className="flex items-start gap-3">
                <Check className="mt-0.5 shrink-0 text-[#159a76]" size={19} />{" "}
                Recomendaciones explicables, sin servicios externos de IA.
              </p>
            </div>
          </div>
        </section>
        <section id="instalar" className="bg-[#fffaf2] py-24 md:py-28">
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 md:px-8 lg:grid-cols-2">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e6f2f9] px-3 py-1.5 text-sm font-semibold text-[#237da9]">
                <Smartphone size={16} /> Siempre a mano
              </span>
              <h2 className="text-[clamp(2.1rem,4vw,3.5rem)] leading-[1.15] font-extrabold tracking-[-.035em]">
                Moneta también puede vivir en tu celular.
              </h2>
              <p className="mt-5 max-w-[510px] text-[16px] leading-[1.85] text-[#657b88]">
                Cuando habiliten la versión PWA, vas a poder agregar Moneta a la
                pantalla de inicio y abrirla como una aplicación, sin pasar por
                una tienda.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Primary onClick={installAction}>
                  {installed ? <Check size={18} /> : <Download size={18} />}{" "}
                  {installed ? "Aplicación instalada" : "Instalar Moneta"}
                </Primary>
                <a
                  href={APP_URL}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cddce3] bg-white px-5 py-3.5 text-[15px] font-semibold text-[#255571] hover:bg-[#f1f7f9]"
                >
                  Usar desde el navegador <ArrowUpRight size={17} />
                </a>
              </div>
              <p className="mt-4 max-w-lg text-xs leading-relaxed text-[#82919a]">
                La instalación estará disponible cuando la aplicación principal
                tenga su manifiesto PWA, íconos y service worker configurados.
              </p>
            </div>
            <div className="rounded-[22px] bg-white p-7 shadow-[0_18px_55px_rgba(46,70,76,.08)] sm:p-10">
              <h3 className="text-xl font-bold">¿Cómo se instala?</h3>
              <div className="mt-7 space-y-7">
                <div className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f4f9] text-[#267fa9]">
                    <Download size={20} />
                  </span>
                  <div>
                    <strong className="text-[16px]">
                      En Android y computadoras
                    </strong>
                    <p className="mt-1 text-sm leading-relaxed text-[#71818a]">
                      Abrí Moneta en un navegador compatible y elegí “Instalar”
                      cuando aparezca la opción.
                    </p>
                  </div>
                </div>
                <div className="h-px bg-[#edf0f1]" />
                <div className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#feede9] text-[#e66d55]">
                    <Smartphone size={20} />
                  </span>
                  <div>
                    <strong className="text-[16px]">En iPhone</strong>
                    <p className="mt-1 text-sm leading-relaxed text-[#71818a]">
                      Abrí Moneta en Safari, tocá Compartir y seleccioná
                      “Agregar a pantalla de inicio”.
                    </p>
                  </div>
                </div>
                <div className="h-px bg-[#edf0f1]" />
                <div className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e5f5e9] text-[#228566]">
                    <Check size={20} />
                  </span>
                  <div>
                    <strong className="text-[16px]">Listo, a usarla</strong>
                    <p className="mt-1 text-sm leading-relaxed text-[#71818a]">
                      Encontrá el ícono en tu pantalla de inicio y accedé a
                      Moneta rápidamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-[950px] px-5 py-24 md:py-28">
          <div className="text-center">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-.035em]">
              Preguntas frecuentes
            </h2>
            <p className="mt-3 text-[#69808d]">
              Todo lo que necesitás saber antes de empezar.
            </p>
          </div>
          <div className="mt-10 divide-y divide-[#e4e7e7] border-y border-[#e4e7e7]">
            {[
              {
                q: "¿Moneta es gratis?",
                a: "Sí. Es un proyecto académico de gestión de finanzas personales que podés usar sin suscripción.",
              },
              {
                q: "¿Necesito crear una cuenta?",
                a: "No. Moneta guarda tus datos en el almacenamiento local del navegador que utilizás.",
              },
              {
                q: "¿Mis datos se sincronizan entre dispositivos?",
                a: "No automáticamente. Al no tener servidor ni cuenta, los datos quedan en cada navegador. Podés exportar e importar un respaldo JSON desde Configuración.",
              },
              {
                q: "¿Moneta usa inteligencia artificial externa?",
                a: "No. El asistente funciona con reglas programadas dentro de la aplicación. El reconocimiento de tickets también se procesa en tu navegador.",
              },
            ].map(({ q, a }, i) => (
              <div key={q}>
                <button
                  className="flex w-full items-center justify-between gap-4 py-6 text-left text-[16px] font-semibold text-[#244354]"
                  aria-expanded={faq === i}
                  onClick={() => setFaq(faq === i ? null : i)}
                >
                  {q}
                  <ChevronDown
                    size={20}
                    className={`shrink-0 transition-transform ${faq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {faq === i && (
                  <p className="max-w-[700px] pb-6 text-[15px] leading-[1.8] text-[#687e8b]">
                    {a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-[1240px] px-5 pb-24 md:px-8 md:pb-28">
          <div className="relative overflow-hidden rounded-[24px] bg-[#207eaf] px-7 py-14 text-center text-white md:px-12 md:py-20">
            <div className="pointer-events-none absolute -top-32 -right-12 h-80 w-80 rounded-full border-[50px] border-white/10" />
            <h2 className="relative text-[clamp(2.2rem,4vw,3.5rem)] font-extrabold tracking-[-.035em]">
              Empezá a llevar tus finanzas
              <br className="hidden sm:block" /> con más claridad.
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[#d8edf6]">
              Un paso pequeño hoy puede acercarte a una meta grande mañana.
            </p>
            <a
              href={APP_URL}
              className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-[#207eaf] transition hover:bg-[#e9f4f9]"
            >
              Abrir Moneta <ArrowRight size={19} />
            </a>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#e7e5df] bg-[#fcfaf6]">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-5 px-5 py-8 md:flex-row md:px-8">
          <Logo />
          <p className="text-center text-xs text-[#84939c]">
            Proyecto final · Tecnicatura Superior en Desarrollo de Software
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#247aa5] hover:underline"
          >
            Ver código en GitHub <ArrowUpRight size={16} />
          </a>
        </div>
      </footer>
      {installOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f293b]/60 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setInstallOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            className="w-full max-w-[490px] rounded-[22px] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e6f2f9] text-[#207eaf]">
                <CircleHelp size={24} />
              </span>
              <button
                onClick={() => setInstallOpen(false)}
                aria-label="Cerrar"
                className="rounded-lg p-2 text-[#687c87] hover:bg-[#f3f6f7]"
              >
                <X size={21} />
              </button>
            </div>
            <h2 id="install-title" className="mt-5 text-2xl font-bold">
              Instalá Moneta desde tu navegador
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[#637784]">
              Si usás un iPhone, abrí la página en Safari, tocá el botón
              Compartir y elegí “Agregar a pantalla de inicio”. En Android o PC,
              buscá “Instalar aplicación” en el menú del navegador.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#82919b]">
              Si no aparece la opción, primero hay que configurar y publicar la
              PWA de Moneta.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInstallOpen(false)}
                className="rounded-xl bg-[#207eaf] px-5 py-3 text-sm font-semibold text-white"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
