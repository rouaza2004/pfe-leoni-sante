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

function renderDocShell({ title, content }) {
  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 16mm 15mm 18mm;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #111827;
          font-family: "Times New Roman", Times, serif;
          font-size: 12.5pt;
          line-height: 1.5;
        }

        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .sheet {
          width: 180mm;
          min-height: 260mm;
          margin: 0 auto;
          position: relative;
        }

        .doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16mm;
        }

        .doctor-block,
        .arabic-block {
          width: 46%;
        }

        .doctor-block {
          font-weight: 700;
        }

        .doctor-block .line {
          margin-bottom: 2mm;
        }

        .doctor-block .muted {
          font-weight: 600;
        }

        .arabic-block {
          text-align: right;
          direction: rtl;
          font-weight: 700;
          line-height: 1.7;
        }

        .date-line {
          margin-top: 10mm;
          margin-bottom: 16mm;
          font-weight: 700;
          text-align: center;
        }

        .date-fill {
          display: inline-block;
          min-width: 80mm;
          border-bottom: 0.4mm dotted #4b5563;
          padding: 0 1mm 1mm;
          text-align: left;
        }

        .doc-title {
          margin: 0 0 14mm;
          text-align: center;
          font-size: 15pt;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .paragraph {
          margin: 0 0 7mm;
          text-align: justify;
        }

        .line-fill {
          display: inline-block;
          min-width: 45mm;
          border-bottom: 0.4mm solid #6b7280;
          padding: 0 1mm 0.5mm;
          line-height: 1.2;
          vertical-align: baseline;
        }

        .line-fill.wide {
          min-width: 88mm;
        }

        .line-fill.medium {
          min-width: 58mm;
        }

        .line-fill.short {
          min-width: 22mm;
          text-align: center;
        }

        .notes-block {
          min-height: 85mm;
          border: 0.35mm solid #9ca3af;
          padding: 5mm 6mm;
          margin-top: 10mm;
          page-break-inside: avoid;
        }

        .notes-title {
          margin-bottom: 4mm;
          font-size: 11pt;
          font-weight: 700;
          text-transform: uppercase;
        }

        .notes-content {
          white-space: normal;
          word-break: break-word;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8mm;
        }

        th,
        td {
          border: 0.35mm solid #9ca3af;
          padding: 3.5mm 3mm;
          vertical-align: top;
          font-size: 11pt;
        }

        th {
          text-align: left;
          font-weight: 700;
        }

        .signature-area {
          margin-top: 16mm;
          display: flex;
          justify-content: flex-end;
        }

        .signature-box {
          width: 65mm;
          text-align: center;
        }

        .signature-line {
          margin-top: 18mm;
          border-top: 0.35mm solid #6b7280;
          padding-top: 2mm;
        }

        .footer {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 11.5pt;
          padding-top: 4mm;
          border-top: 0.35mm solid #9ca3af;
        }
      </style>
    </head>
    <body>
      <main class="sheet">
        ${content}
        <footer class="footer">
          <span>Leoni Menzel Hayet</span>
          <span>Service Médical</span>
        </footer>
      </main>
    </body>
  </html>`;
}

export function buildCertificatPrintHtml({ doctor, form }) {
  const consultationDate = formatDate(form.dateConsultation) || "&nbsp;";
  const patientName = escapeHtml(form.nomPrenom || "") || "&nbsp;";
  const nbJours = escapeHtml(form.nbJoursRepos || "") || "&nbsp;";
  const dateDebut = formatDate(form.dateDebutRepos) || "&nbsp;";
  const commentaire = form.commentaireComplications?.trim()
    ? `<p class="paragraph">${nl2br(form.commentaireComplications)}</p>`
    : "";
  const diagnostic = form.diagnostic?.trim()
    ? `<div class="notes-block">
        <div class="notes-title">Observation / diagnostic</div>
        <div class="notes-content">${nl2br(form.diagnostic)}</div>
      </div>`
    : "";

  return renderDocShell({
    title: "Certificat médical",
    content: `
      <section class="doc-header">
        <div class="doctor-block">
          <div class="line">Docteur</div>
          <div class="line">${escapeHtml(doctor.name)}</div>
          <div class="line muted">${escapeHtml(doctor.speciality)}</div>
        </div>
        <div class="arabic-block">
          <div>الدكتور</div>
          <div>${escapeHtml(doctor.arabicName || doctor.name)}</div>
          <div>${escapeHtml(doctor.arabicSpeciality)}</div>
        </div>
      </section>

      <div class="date-line">
        Menzel Hayet, le <span class="date-fill">${escapeHtml(consultationDate)}</span>
      </div>

      <h1 class="doc-title">Certificat Medical</h1>

      <p class="paragraph">
        Je soussigné, Docteur ${escapeHtml(doctor.name)}, certifie avoir reçu et
        examiné aujourd'hui M <span class="line-fill wide">${patientName}</span>
      </p>

      <p class="paragraph">
        et que son état de santé nécessite (<span class="line-fill short">${nbJours}</span>)
        jour(s) de repos à partir du <span class="line-fill medium">${escapeHtml(dateDebut)}</span>
        sauf complications ultérieures.
      </p>

      ${commentaire}

      <p class="paragraph">
        Certificat délivré à l'intéressé(e) pour servir et valoir ce que de droit.
      </p>

      ${diagnostic}
    `,
  });
}

export function buildOrdonnancePrintHtml({ doctor, form, medicaments }) {
  const consultationDate = formatDate(form.dateConsultation) || "&nbsp;";
  const diagnostic = form.diagnostic?.trim()
    ? `<div class="notes-block">
        <div class="notes-title">Observation / diagnostic</div>
        <div class="notes-content">${nl2br(form.diagnostic)}</div>
      </div>`
    : "";

  const rows = medicaments
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.nomMedicament || "") || "&nbsp;"}</td>
          <td>${escapeHtml(item.posologie || "") || "&nbsp;"}</td>
          <td>${escapeHtml(item.duree || "") || "&nbsp;"}</td>
          <td>${escapeHtml(item.remarque || "") || "&nbsp;"}</td>
        </tr>
      `
    )
    .join("");

  return renderDocShell({
    title: "Ordonnance",
    content: `
      <section class="doc-header">
        <div class="doctor-block">
          <div class="line">Docteur</div>
          <div class="line">${escapeHtml(doctor.name)}</div>
          <div class="line muted">${escapeHtml(doctor.speciality)}</div>
        </div>
        <div class="arabic-block">
          <div>الدكتور</div>
          <div>${escapeHtml(doctor.arabicName || doctor.name)}</div>
          <div>${escapeHtml(doctor.arabicSpeciality)}</div>
        </div>
      </section>

      <div class="date-line">
        Menzel Hayet, le <span class="date-fill">${escapeHtml(consultationDate)}</span>
      </div>

      <h1 class="doc-title">Ordonnance</h1>

      <p class="paragraph">
        Patient : <span class="line-fill wide">${escapeHtml(form.nomPrenom || "") || "&nbsp;"}</span>
      </p>
      <p class="paragraph">
        Matricule : <span class="line-fill medium">${escapeHtml(form.matricule || "") || "&nbsp;"}</span>
        &nbsp;&nbsp;&nbsp;
        Date de naissance : <span class="line-fill medium">${escapeHtml(formatDate(form.dateNaissance) || "") || "&nbsp;"}</span>
      </p>

      <table>
        <thead>
          <tr>
            <th>Médicament</th>
            <th>Posologie</th>
            <th>Durée</th>
            <th>Remarque</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      ${diagnostic}

      <div class="signature-area">
        <div class="signature-box">
          <div>${escapeHtml(doctor.name)}</div>
          <div class="signature-line">Signature / Cachet</div>
        </div>
      </div>
    `,
  });
}
