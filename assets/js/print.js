(() => {
  const header = document.querySelector("header");
  const content = document.querySelector("main.content");
  if (!header || !content) return;
  const logoUrl = document.querySelector("header .logo img")?.src || "";

  const formatDate = () => new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const letterhead = document.createElement("section");
  letterhead.className = "print-letterhead";
  letterhead.setAttribute("aria-hidden", "true");
  letterhead.innerHTML = `
    <div class="print-company">
      <img src="${logoUrl}" alt="" width="184" height="32" />
      <span>HitoFusion</span>
    </div>
    <div class="print-date"><strong>Fecha</strong><span>${formatDate()}</span></div>
  `;
  content.prepend(letterhead);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "print-button";
  button.setAttribute("aria-label", "Imprimir para entregar al cliente");
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>
    </svg>
    <span>Imprimir para entregar</span>
  `;
  button.addEventListener("click", () => window.print());
  header.append(button);
})();
