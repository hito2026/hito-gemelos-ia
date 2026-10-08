#!/usr/bin/env ruby
require "cgi"

source = STDIN.read
abort "El informe está vacío" if source.strip.empty?

def inline(text)
  escaped = CGI.escapeHTML(text)
  escaped.gsub!(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/, '<a href="\2" target="_blank" rel="noopener noreferrer">\1</a>')
  escaped.gsub!(/\*\*([^*]+)\*\*/, '<strong>\1</strong>')
  escaped.gsub!(/`([^`]+)`/, '<code>\1</code>')
  escaped
end

def slug(text, used)
  base = text.downcase.unicode_normalize(:nfkd).encode("ASCII", replace: "").gsub(/[^a-z0-9]+/, "-").gsub(/^-|-$/, "")
  base = "seccion" if base.empty?
  count = used[base]
  used[base] += 1
  count.zero? ? base : "#{base}-#{count + 1}"
end

lines = source.lines.map(&:rstrip)
used = Hash.new(0)
headings = []
body = []
i = 0

while i < lines.length
  line = lines[i]
  if line.empty?
    i += 1
    next
  end

  if (match = line.match(/^(\#{1,6})\s+(.+)$/))
    level = [match[1].length + 1, 6].min
    title = match[2]
    id = slug(title.gsub(/[*`]/, ""), used)
    headings << [level, title.gsub(/[*`]/, ""), id] if level <= 4
    body << %(<h#{level} id="#{id}">#{inline(title)}</h#{level}>)
    i += 1
    next
  end

  if line.start_with?("|") && i + 1 < lines.length && lines[i + 1].match?(/^\|?[\s:|-]+\|/)
    rows = []
    while i < lines.length && lines[i].start_with?("|")
      rows << lines[i].sub(/^\|/, "").sub(/\|$/, "").split("|").map(&:strip)
      i += 1
    end
    header = rows.shift
    rows.shift
    body << '<div class="table-scroll"><table><thead><tr>' + header.map { |cell| "<th>#{inline(cell)}</th>" }.join + '</tr></thead><tbody>'
    rows.each { |row| body << '<tr>' + row.map { |cell| "<td>#{inline(cell)}</td>" }.join + '</tr>' }
    body << '</tbody></table></div>'
    next
  end

  if line.match?(/^[-*]\s+/)
    items = []
    while i < lines.length && lines[i].match?(/^[-*]\s+/)
      items << lines[i].sub(/^[-*]\s+/, "")
      i += 1
    end
    body << '<ul>' + items.map { |item| "<li>#{inline(item)}</li>" }.join + '</ul>'
    next
  end

  if line.match?(/^\d+\.\s+/)
    items = []
    while i < lines.length && lines[i].match?(/^\d+\.\s+/)
      items << lines[i].sub(/^\d+\.\s+/, "")
      i += 1
    end
    body << '<ol>' + items.map { |item| "<li>#{inline(item)}</li>" }.join + '</ol>'
    next
  end

  if line.start_with?("> ")
    body << "<blockquote>#{inline(line.sub(/^>\s?/, ""))}</blockquote>"
    i += 1
    next
  end

  paragraph = [line]
  i += 1
  while i < lines.length && !lines[i].empty? && !lines[i].match?(/^(\#{1,6})\s+|^[-*]\s+|^\d+\.\s+|^>\s|^\|/)
    paragraph << lines[i]
    i += 1
  end
  body << "<p>#{inline(paragraph.join(" "))}</p>"
end

toc = headings.select { |level, _, _| level <= 3 }.map do |level, title, id|
  %(<a class="toc-level-#{level}" href="##{id}">#{CGI.escapeHTML(title)}</a>)
end.join

html = <<~HTML
  <!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="description" content="Informe ejecutivo de factibilidad para la instalación local de Odoo Enterprise 19.0">
    <title>Instalación Odoo Local · Informes · Wiki de HitoFusion</title>
    <link rel="stylesheet" href="assets/style.css">
    <link rel="stylesheet" href="assets/news.css">
    <link rel="stylesheet" href="assets/report.css">
  </head>
  <body>
  <header class="screen-header"><div class="top"><a class="brand" href="index.html">HITOFUSION</a><nav><a href="index.html">Inicio</a><a href="infraestructura-local.html">Infraestructura</a><a href="#contenido">Informe</a><a href="#15-fuentes">Fuentes</a></nav></div><div class="masthead news-head"><p class="kicker">Informes · Instalación Odoo Local</p><h1>Informe ejecutivo</h1><p>Factibilidad de instalación, operación e integración de Odoo Enterprise 19.0 en infraestructura local.</p><span class="status">Versión 0.2 · 18 de agosto de 2026</span></div></header>
  <main class="report-page">
    <div class="report-tools"><nav class="breadcrumbs" aria-label="Migas de pan"><a href="index.html">Wiki</a><span>›</span><b>Informes</b><span>›</span><strong>Instalación Odoo Local</strong></nav><button type="button" onclick="window.print()" aria-label="Imprimir informe o guardarlo como PDF">Imprimir / Guardar PDF</button></div>
    <aside class="report-toc"><p class="label">Contenido</p>#{toc}</aside>
    <article id="contenido" class="report-document">#{body.join("\n")}</article>
  </main>
  <footer class="screen-footer"><b>Sección:</b> Informes › Instalación Odoo Local · <b>Estado:</b> borrador para entrega.</footer>
  </body>
  </html>
HTML

STDOUT.write(html)
