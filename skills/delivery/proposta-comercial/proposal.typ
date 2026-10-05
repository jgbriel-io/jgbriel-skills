#let conf(
  title: none,
  subtitle: none,
  authors: (),
  date: none,
  lang: "pt",
  region: "br",
  ..args,
) = {
  let doc = args.pos().last()

  set document(title: title)
  set page(
    paper: "a4",
    margin: (top: 2.2cm, bottom: 2.2cm, x: 2.3cm),
    footer: context align(center, text(size: 9pt, fill: luma(110))[
      #counter(page).display("1 / 1", both: true)
    ]),
  )
  set text(font: "New Computer Modern", size: 11pt, lang: lang, region: region)
  set par(justify: true, leading: 0.68em)
  show link: set text(fill: black)
  set table(stroke: (x, y) => (top: if y <= 1 { 0.6pt } else { 0.3pt + luma(190) }, bottom: 0.6pt))
  show table.cell.where(y: 0): set text(weight: "bold")
  show heading.where(level: 2): it => block(above: 1.4em, below: 0.7em, text(size: 13pt, it))
  show heading.where(level: 3): it => block(above: 1.1em, below: 0.6em, text(size: 11.5pt, it))

  block(below: 1.6em, {
    text(size: 19pt, weight: "bold", hyphenate: false, title)
    if subtitle != none { linebreak(); text(size: 13pt, subtitle) }
    v(0.4em)
    let names = authors.map(a => a.name)
    text(size: 10pt, fill: luma(90), (names + if date != none { (date,) } else { () }).join(" · "))
    line(length: 100%, stroke: 0.6pt)
  })

  doc
}
