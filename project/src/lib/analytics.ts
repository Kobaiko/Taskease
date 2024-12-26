export function initializeGoogleAnalytics() {
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-CEDBMXRBYX';

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-CEDBMXRBYX');
  `;

  document.head.appendChild(script1);
  document.head.appendChild(script2);
}

export function removeGoogleAnalytics() {
  const scripts = document.head.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const script = scripts[i];
    if (
      script.src.includes('googletagmanager.com/gtag') ||
      script.innerHTML.includes('gtag')
    ) {
      script.remove();
    }
  }
}