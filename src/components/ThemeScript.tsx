// src/components/ThemeScript.tsx — applies theme before render to avoid FOUC

export function ThemeScript() {
  const code = `
    (function() {
      try {
        var theme = localStorage.getItem('theme') || 'light';
        var locale = (document.cookie.match(/(?:^|; )locale=([^;]+)/) || [])[1] || 'fr';
        if (theme === 'dark') document.documentElement.classList.add('dark');
        document.documentElement.lang = locale;
        if (locale === 'ar') document.documentElement.dir = 'rtl';
      } catch (e) {}
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
