import { api } from "@/api/api";

function getBlobUrl(blob) {
  return URL.createObjectURL(blob);
}

async function fetchBlob(method, url, data) {
  const response = await api.request({
    url,
    method,
    data,
    responseType: "blob",
  });
  return response.data;
}

export async function getReportsDashboardStats() {
  const response = await api.get("/medical/hsee/reports/dashboard/");
  return response.data || {};
}

export async function getReportTemplates() {
  const response = await api.get("/medical/hsee/reports/templates/");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getReportTemplateDetails(templateId) {
  const response = await api.get(`/medical/hsee/reports/templates/${templateId}/`);
  return response.data || null;
}

export async function getGeneratedReports(params = {}) {
  const response = await api.get("/medical/hsee/reports/", { params });
  return Array.isArray(response.data) ? response.data : [];
}

export async function generateReport(payload) {
  const response = await api.post("/medical/hsee/reports/generate/", payload);
  return response.data;
}

export async function previewReport(payload) {
  const blob = await fetchBlob("post", "/medical/hsee/reports/preview/", payload);
  return getBlobUrl(blob);
}

export async function previewGeneratedReport(reportId) {
  const blob = await fetchBlob("get", `/medical/hsee/reports/${reportId}/preview/`);
  return getBlobUrl(blob);
}

export async function downloadReport(reportId, filename = "rapport-hsee") {
  const blob = await fetchBlob("get", `/medical/hsee/reports/${reportId}/download/`);
  const url = getBlobUrl(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function sendReport(reportId) {
  const response = await api.post(`/medical/hsee/reports/${reportId}/send/`);
  return response.data;
}

export async function printReport(reportId) {
  const url = await previewGeneratedReport(reportId);
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (tab) {
    tab.addEventListener(
      "load",
      () => {
        setTimeout(() => {
          tab.print();
        }, 250);
      },
      { once: true }
    );
  }
  return url;
}
