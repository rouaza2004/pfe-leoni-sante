function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function formatDate(value = "") {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR");
}

export function buildFicheMedicalePrintHtml({ form, logoSrc, savedAt }) {
  const identityDateLieu = [formatDate(form.dateNaissance), form.lieuNaissance]
    .filter(Boolean)
    .join(" - ");

  const notes = form.notes?.trim()
    ? nl2br(form.notes)
    : "Aucune observation medicale renseignee.";

  const updatedLine = savedAt
    ? `Derniere mise a jour : ${escapeHtml(new Date(savedAt).toLocaleString("fr-FR"))}`
    : "Document prepare pour impression.";

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Fiche medicale</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #0f172a;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          line-height: 1.35;
        }

        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .sheet {
          width: 190mm;
          min-height: 277mm;
          margin: 0 auto;
          padding: 8mm 7mm 10mm;
          position: relative;
          background-image:
            linear-gradient(to right, rgba(148, 163, 184, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.18) 1px, transparent 1px);
          background-size: 8mm 8mm;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10mm;
          margin-bottom: 8mm;
        }

        .logo-box {
          width: 62mm;
          min-height: 34mm;
          padding: 4mm 2mm 2mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2mm;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 3mm;
        }

        .logo {
          width: 20mm;
          height: 20mm;
          object-fit: contain;
        }

        .brand {
          font-size: 11pt;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .subbrand {
          font-size: 11pt;
          font-weight: 800;
          color: #f59e0b;
          letter-spacing: 0.06em;
        }

        .identifier-box {
          flex: 1;
          min-height: 34mm;
          border: 1.3mm solid #475569;
          border-radius: 7mm;
          padding: 6mm;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .identifier-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #475569;
          margin-bottom: 2mm;
        }

        .identifier-value {
          font-size: 24pt;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .identity-block {
          width: 100%;
          border: 1.3mm solid #475569;
          border-radius: 8mm;
          padding: 6mm 7mm;
          margin-bottom: 8mm;
        }

        .identity-row {
          display: flex;
          align-items: baseline;
          gap: 3mm;
          margin-bottom: 3.4mm;
        }

        .identity-row:last-child {
          margin-bottom: 0;
        }

        .identity-label {
          min-width: 42mm;
          font-weight: 700;
          text-decoration: underline;
        }

        .identity-value {
          flex: 1;
          min-height: 5mm;
          border-bottom: 0.4mm dotted #94a3b8;
          padding-bottom: 1mm;
          word-break: break-word;
        }

        .notes-block {
          min-height: 160mm;
          border: 1mm solid #64748b;
          border-radius: 6mm;
          background: rgba(255, 255, 255, 0.9);
          padding: 6mm;
        }

        .notes-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #475569;
          margin-bottom: 4mm;
        }

        .notes-content {
          white-space: normal;
          word-break: break-word;
        }

        .footer {
          margin-top: 5mm;
          text-align: right;
          font-size: 10px;
          color: #64748b;
        }

        .page-break {
          break-before: page;
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        <section class="header">
          <div class="logo-box">
            <div class="logo-row">
              <img class="logo" src="${escapeHtml(logoSrc)}" alt="LEONI" />
              <div class="brand">LEONI</div>
            </div>
            <div class="subbrand">HSEE</div>
          </div>

          <div class="identifier-box">
            <div>
              <div class="identifier-label">Matricule / Numero</div>
              <div class="identifier-value">${escapeHtml(form.matricule || "") || "&nbsp;"}</div>
            </div>
          </div>
        </section>

        <section class="identity-block">
          <div class="identity-row">
            <div class="identity-label">Nom et prenom :</div>
            <div class="identity-value">${escapeHtml(form.nomPrenom || "") || "&nbsp;"}</div>
          </div>
          <div class="identity-row">
            <div class="identity-label">Date et lieu de naissance :</div>
            <div class="identity-value">${escapeHtml(identityDateLieu) || "&nbsp;"}</div>
          </div>
          <div class="identity-row">
            <div class="identity-label">Adresse :</div>
            <div class="identity-value">${escapeHtml(form.adresse || "") || "&nbsp;"}</div>
          </div>
          <div class="identity-row">
            <div class="identity-label">Tel :</div>
            <div class="identity-value">${escapeHtml(form.telephone || "") || "&nbsp;"}</div>
          </div>
        </section>

        <section class="notes-block">
          <div class="notes-title">Observations medicales / historique</div>
          <div class="notes-content">${notes}</div>
        </section>

        <div class="footer">${updatedLine}</div>
      </main>
    </body>
  </html>`;
}

