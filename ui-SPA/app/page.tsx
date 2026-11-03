"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clipboard,
  Download,
  Github,
  Heart,
  Keyboard,
  Languages,
  Menu,
  Palette,
  Search,
  Terminal,
  X,
  Zap,
  Moon,
  Sun,
} from "lucide-react";

const repoUrl = "https://github.com/DavisNoah02/JESUS_CLI";
const repoUrldocs = "https://github.com/DavisNoah02/JESUS_CLI/tree/main/docs";

const installMethods = {
  npm: "npm install -g jesuschrist-cli",
  pnpm: "pnpm add -g jesuschrist-cli",
  yarn: "yarn global add jesuschrist-cli",
  npx: "npx jesuschrist-cli",
};

const presets = [
  {
    command: "jesus read John 3:16",
    output: [
      ["John 3:16", "gold"],
      ["For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", ""],
    ] as const,
  },
  {
    command: "jesus search \"love one another\"",
    output: [["Search results for love one another", "gold"], ["1. John 13:34 — A new commandment I give unto you", "cyan"], ["2. 1 John 4:7 — Beloved, let us love one another", "cyan"]] as const,
  },
  {
    command: "jesus today",
    output: [["Verse of the Day", "gold"], ["Thy word is a lamp unto my feet, and a light unto my path.", "cyan"], ["— Psalm 119:105", "dim"]] as const,
  },
  {
    command: "jesus start",
    output: [["jesuschrist-cli · terminal UI", "gold"], ["Books        Chapters        Scripture", "dim"], ["John         3               For God so loved...", "cyan"]] as const,
  },
];

const features = [
  { icon: Zap, title: "Fast Node.js CLI", body: "Designed for instant reading, search, navigation, and chapter movement from your terminal." },
  { icon: BookOpen, title: "Bundled Scripture", body: "Read the complete KJV immediately, without an account or a network connection." },
  { icon: Languages, title: "Multiple Translations", body: "Choose supported online translations when broader source and reading options are needed." },
  { icon: Keyboard, title: "Keyboard-First Navigation", body: "Move through Scripture, themes, books, chapters, and search results without leaving the keyboard." },
  { icon: Search, title: "Useful Reference Parsing", body: "Compact book names, dotted references, verse ranges, and whole-chapter ranges are supported." },
  { icon: Palette, title: "Personal Terminal Themes", body: "Five thoughtfully balanced themes make long reading sessions feel natural and focused." },
];

const themes = {
  Slate: { bg: "#161a1f", text: "#d6dbe1", muted: "#7d8793", accent: "#d58b54", line: "#303944" },
  Midnight: { bg: "#090d18", text: "#d6def4", muted: "#68748f", accent: "#829ee8", line: "#242d43" },
  Parchment: { bg: "#e8dfca", text: "#3e3528", muted: "#8d7e68", accent: "#a34f32", line: "#c6b89e" },
  Gospel: { bg: "#1b1714", text: "#f0d8ad", muted: "#967d5f", accent: "#e8a94d", line: "#493a2b" },
  Terminal: { bg: "#080b08", text: "#b1d8ae", muted: "#568056", accent: "#77db70", line: "#204a23" },
};

const shortcuts = [
  ["h j k l", "Navigate"], ["/", "Live Search"], ["y", "Copy Verse"], ["t", "Cycle Themes"], ["v", "Pick Translation"], ["p", "Chapter View"],
];

export default function Page() {
  const [method, setMethod] = useState<keyof typeof installMethods>("npm");
  const [copied, setCopied] = useState(false);
  const [preset, setPreset] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<keyof typeof themes>("Slate");
  const [colorMode, setColorMode] = useState<"dark" | "light">("dark");

  async function copyInstall() {
    await navigator.clipboard?.writeText(installMethods[method]);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main
      className={`site-shell ${colorMode}`}
      onPointerMove={(event) => {
        event.currentTarget.style.setProperty("--pointer-x", `${event.clientX}px`);
        event.currentTarget.style.setProperty("--pointer-y", `${event.clientY}px`);
      }}
    >
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#top" className="brand" aria-label="jesuschrist-cli home"><span className="brand-mark"><Terminal size={17} /></span><span>jesuschrist-cli</span><span className="runtime-badge">NODE</span></a>
        <div className={`nav-links ${menuOpen ? "is-open" : ""}`}>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#commands" onClick={() => setMenuOpen(false)}>Commands</a>
          <a href="#themes" onClick={() => setMenuOpen(false)}>Themes</a>
          <a href={`${repoUrldocs}#readme`} target="_blank" rel="noreferrer">Docs <ArrowUpRight size={13} /></a>
        </div>
        <a className="github-cta" href={repoUrl} target="_blank" rel="noreferrer"><Github size={15} /> View source <span>GitHub</span></a>
        <button
          className="theme-toggle"
          type="button"
          aria-label={`Switch to ${colorMode === "dark" ? "light" : "dark"} mode`}
          onClick={() => setColorMode((current) => (current === "dark" ? "light" : "dark"))}
        >
          {colorMode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="menu-button" aria-expanded={menuOpen} aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </nav>

      <section id="top" className="hero section-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> Built with Node.js <span className="dot-separator">•</span> Scripture in your flow</div>
          <h1>Read Scripture<br /><em>right in your terminal.</em></h1>
          <p className="hero-subtitle">A fast, keyboard-first Bible CLI and terminal interface for developers. Read passages, search Scripture, navigate chapters, and stay focused.</p>
          <div className="install-card">
            <div className="install-tabs" role="tablist" aria-label="Install method">
              {(Object.keys(installMethods) as Array<keyof typeof installMethods>).map((key) => <button id={`tab-${key}`} role="tab" aria-selected={method === key} key={key} className={method === key ? "active" : ""} onClick={() => { setMethod(key); setCopied(false); }}>{key}</button>)}
            </div>
            <div className="install-command"><span><span className="prompt-symbol">$</span> {installMethods[method]}</span><button onClick={copyInstall} aria-label="Copy install command">{copied ? <><Check size={16} /> Copied</> : <><Clipboard size={16} /> Copy</>}</button></div>
          </div>
          <div className="hero-meta"><span><Download size={14} /> Node.js CLI</span><span><Heart size={14} /> Open source</span></div>
        </div>
        <TerminalWidget preset={preset} setPreset={setPreset} />
      </section>

      <section id="features" className="section-wrap feature-section">
        <div className="section-kicker">WHY JESUSCHRIST-CLI</div>
        <div className="section-heading"><h2>Everything you need.<br /><span>Nothing you don&apos;t.</span></h2><p>A calm, capable terminal tool shaped around Scripture and developer workflows.</p></div>
        <div className="features-grid">{features.map(({ icon: Icon, title, body }) => <article className="feature-card" key={title}><Icon size={20} /><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section id="themes" className="section-wrap themes-section">
        <div className="section-kicker">MAKE IT YOURS</div>
        <div className="section-heading"><h2>A theme for every<br /><span>kind of quiet.</span></h2><p>Choose a palette for your terminal. Press <kbd>t</kbd> inside the TUI.</p></div>
        <div className="theme-picker">{(Object.keys(themes) as Array<keyof typeof themes>).map((name) => <button key={name} aria-pressed={theme === name} className={theme === name ? "selected" : ""} onClick={() => setTheme(name)}><span style={{ background: themes[name].accent }} />{name}</button>)}</div>
        <div className="theme-preview" style={{ background: themes[theme].bg, color: themes[theme].text, borderColor: themes[theme].line }}>
          <div className="preview-top"><span style={{ color: themes[theme].accent }}>jesuschrist-cli</span><span style={{ color: themes[theme].muted }}>THEME: {theme.toUpperCase()}</span></div>
          <div className="preview-body"><aside style={{ borderColor: themes[theme].line }}><span style={{ color: themes[theme].muted }}>BOOKS</span><strong style={{ color: themes[theme].accent }}>John</strong><span>Romans</span><span>Genesis</span><span>Psalms</span></aside><div><span style={{ color: themes[theme].muted }}>JOHN 3:16</span><p>For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.</p><span style={{ color: themes[theme].accent }}>[h/j/k/l] navigate [y] copy [?] help</span></div></div>
        </div>
      </section>

      <section id="commands" className="section-wrap shortcuts-section">
        <div className="section-kicker">KEEP YOUR HANDS HOME</div>
        <div className="section-heading"><h2>Keyboard first.<br /><span>Always.</span></h2><p>Common actions stay close to the keys you already use.</p></div>
        <div className="shortcut-grid">{shortcuts.map(([key, label]) => <div className="shortcut" key={label}><kbd>{key}</kbd><span>{label}</span></div>)}</div>
      </section>

      <footer className="site-footer section-wrap">
        <a href="#top" className="brand"><span className="brand-mark"><Terminal size={17} /></span><span>jesuschrist-cli</span></a>
        <p>Built for God's glory &amp; developer productivity.</p>
        <div><span>Open source</span><a href="https://jesus.io" target="_blank" rel="noreferrer">jesus.io <ArrowUpRight size={13} /></a></div>
      </footer>
    </main>
  );
}

function TerminalWidget({ preset, setPreset }: { preset: number; setPreset: (preset: number) => void }) {
  return <div className="terminal-wrap"><div className="terminal-window"><div className="terminal-bar"><span className="window-dot red" /><span className="window-dot yellow" /><span className="window-dot green" /><span className="terminal-title">jesuschrist-cli — terminal</span></div><div className="terminal-screen"><div className="terminal-line"><span className="term-green">you@machine</span><span className="term-dim"> ~/scripture</span> <span className="term-gold">$</span> <span className="terminal-command">{presets[preset].command}</span></div><div className="terminal-output">{presets[preset].output.map(([line, style], index) => <div className={style ? `term-${style}` : ""} key={`${line}-${index}`}>{line}</div>)}</div><div className="terminal-cursor"><span className="term-green">you@machine</span><span className="term-dim"> ~/scripture</span> <span className="term-gold">$</span> <span className="cursor-block" /></div></div></div><div className="preset-buttons">{presets.map((item, index) => <button key={item.command} className={preset === index ? "active" : ""} onClick={() => setPreset(index)}><ChevronRight size={13} /> {item.command}</button>)}</div></div>;
}
