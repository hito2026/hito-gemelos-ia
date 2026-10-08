(() => {
  const sidebar = document.querySelector(".sidebar");
  const rootList = sidebar?.querySelector(":scope > ul");
  if (!rootList) return;

  const normalizePath = (path) => path.replace(/index\.html$/, "").replace(/\/$/, "");
  const currentPath = normalizePath(window.location.pathname);
  rootList.querySelectorAll("a").forEach((link) => {
    if (normalizePath(new URL(link.href, window.location.origin).pathname) === currentPath) {
      link.classList.add("active");
    }
  });

  const numberList = (list, prefix = [], isRoot = false) => {
    let position = 0;

    [...list.children].forEach((item) => {
      if (!(item instanceof HTMLLIElement)) return;

      const directLink = [...item.children].find((child) => child instanceof HTMLAnchorElement);
      const details = [...item.children].find((child) => child instanceof HTMLDetailsElement);
      const summary = details?.querySelector(":scope > summary");
      const isHome = isRoot && directLink?.textContent.trim() === "Home";

      if (!isHome) {
        position += 1;
        const parts = [...prefix, position];
        const marker = document.createElement("span");
        marker.className = "nav-number";
        marker.textContent = parts.length === 1 ? `${parts[0]}.` : parts.join(".");
        marker.setAttribute("aria-hidden", "true");

        const label = summary || directLink;
        label?.prepend(marker);

        const childList = details?.querySelector(":scope > ul");
        if (childList) numberList(childList, parts);
      }
    });
  };

  numberList(rootList, [], true);
})();
