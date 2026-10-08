(() => {
  const root = document.querySelector("[data-site-search]");
  if (!root) return;

  const input = root.querySelector("input");
  const results = root.querySelector("[data-search-results]");
  const scriptUrl = new URL(document.currentScript.src);
  const siteRoot = new URL("../../", scriptUrl);
  const indexUrl = new URL("assets/search-index.json", siteRoot);
  let indexPromise;
  let activeIndex = -1;

  const normalize = (value) => value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const loadIndex = () => {
    if (!indexPromise) {
      indexPromise = fetch(indexUrl, { cache: "force-cache" })
        .then((response) => {
          if (!response.ok) throw new Error(`Search index: ${response.status}`);
          return response.json();
        });
    }
    return indexPromise;
  };

  const close = () => {
    results.hidden = true;
    results.replaceChildren();
    activeIndex = -1;
    input.setAttribute("aria-expanded", "false");
  };

  const setActive = (next) => {
    const links = [...results.querySelectorAll("a")];
    if (!links.length) return;
    activeIndex = (next + links.length) % links.length;
    links.forEach((link, position) => {
      link.classList.toggle("is-active", position === activeIndex);
      link.setAttribute("aria-selected", position === activeIndex ? "true" : "false");
    });
    links[activeIndex].scrollIntoView({ block: "nearest" });
  };

  const render = (items, query) => {
    results.replaceChildren();
    activeIndex = -1;

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = `No se encontraron temas para “${query}”.`;
      results.append(empty);
    } else {
      items.slice(0, 12).forEach((item) => {
        const link = document.createElement("a");
        link.href = new URL(item.url.replace(/^\//, ""), siteRoot);
        link.setAttribute("role", "option");
        link.setAttribute("aria-selected", "false");

        const topic = document.createElement("span");
        topic.className = "search-topic";
        topic.textContent = item.topic;

        const page = document.createElement("span");
        page.className = "search-page";
        page.textContent = item.page;

        link.append(topic, page);
        results.append(link);
      });
    }

    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  const search = async () => {
    const rawQuery = input.value.trim();
    const query = normalize(rawQuery);
    if (query.length < 2) {
      close();
      return;
    }

    try {
      const entries = await loadIndex();
      const terms = query.split(/\s+/);
      const matches = entries
        .map((entry) => {
          const topic = normalize(entry.topic);
          const page = normalize(entry.page);
          const body = normalize(entry.text || "");
          const haystack = `${topic} ${page} ${body}`;
          if (!terms.every((term) => haystack.includes(term))) return null;
          let score = 0;
          if (topic === query) score += 100;
          if (topic.startsWith(query)) score += 50;
          if (topic.includes(query)) score += 25;
          if (page.includes(query)) score += 10;
          if (body.includes(query)) score += 3;
          score -= topic.length / 100;
          return { ...entry, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.topic.localeCompare(b.topic, "es"));
      render(matches, rawQuery);
    } catch (error) {
      results.replaceChildren();
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "El buscador no está disponible temporalmente.";
      results.append(empty);
      results.hidden = false;
    }
  };

  input.addEventListener("input", search);
  input.addEventListener("focus", () => {
    if (input.value.trim().length >= 2) search();
  });
  input.addEventListener("keydown", (event) => {
    if (results.hidden) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      results.querySelectorAll("a")[activeIndex].click();
    } else if (event.key === "Escape") {
      close();
    }
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      input.focus();
    }
  });
})();
